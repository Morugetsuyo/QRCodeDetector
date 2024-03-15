'use strict';

let selectionDiv;
let startX, startY, isSelecting = false;

// Function to create and style the selectionDiv if it doesn't already exist
function createSelectionDiv() {
    if (!selectionDiv) {
        selectionDiv = document.createElement('div');
        selectionDiv.className = 'selection-rectangle'; // Use a class for styling
        document.body.appendChild(selectionDiv);
        Object.assign(selectionDiv.style, {
            position: 'absolute',
            zIndex: '2147483647', // Ensure it's on top
            border: '2px solid #5eeb57',
            display: 'none' // Initially hidden
        });
    }
}



// Function to update the selectionDiv's position and size
function updateSelectionDiv(x, y, width, height) {
    Object.assign(selectionDiv.style, {
        left: `${x}px`,
        top: `${y}px`,
        width: `${Math.abs(width)}px`,
        height: `${Math.abs(height)}px`,
        display: 'block', // Make div visible
    });
}

function clearSelectionDiv() {
    selectionDiv.style.display = 'none'; // Hide the selection div
}

// Function to start the selection process
function activateSelectionMode() {
    createSelectionDiv(); // Ensure the selectionDiv exists

    document.addEventListener('mousedown', (e) => {
        isSelecting = true;
        startX = e.pageX;
        startY = e.pageY;
        updateSelectionDiv(startX, startY, 0, 0);
    });
}

// Function to clean up event listeners and hide the selectionDiv
function deactivateSelectionMode() {
    if (selectionDiv) {
        selectionDiv.style.display = 'none';
    }

    document.removeEventListener('mousedown', startDrawing);
    document.removeEventListener('mouseup', stopDrawing);
    document.removeEventListener('mousemove', onMouseMove);

    console.log('Selection mode deactivated');
}

function startDrawing(e) {
    isSelecting = true;
    startX = e.pageX;
    startY = e.pageY;
    updateSelectionDiv(startX, startY, 0, 0); // Initialize the div size and position
    selectionDiv.style.display = 'block';
}

function stopDrawing() {
    if (isSelecting) {
        isSelecting = false;
        captureSelectedArea();
    }
}

function onMouseMove(e) {
    if (isSelecting) {
        const width = e.pageX - startX;
        const height = e.pageY - startY;
        updateSelectionDiv(startX, startY, width, height);
    }
}



// Function to capture the selected area using html2canvas
function captureSelectedArea() {
    html2canvas(document.body, {
        x: selectionDiv.offsetLeft,
        y: selectionDiv.offsetTop,
        width: selectionDiv.offsetWidth,
        height: selectionDiv.offsetHeight,
        useCORS: true, // For cross-origin images
        logging: true,
        scale: 1 // Adjust scale if necessary
    }).then(canvas => {
        const dataUrl = canvas.toDataURL();
        console.log('Area captured');
        // Send the data URL back for further processing
        chrome.runtime.sendMessage({action: 'capturedDataUrl', dataUrl: dataUrl});

        deactivateSelectionMode(); // Deactivate selection mode after capturing
    }).catch(error => {
        console.error('Error capturing selected area:', error);
        deactivateSelectionMode();
    });
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'initiateAreaSelection') {
        activateSelectionMode();
        sendResponse({status: 'Selection mode activated'});
    }
});
