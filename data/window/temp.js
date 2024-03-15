'use strict';

let selectionDiv;
let startX, startY, isSelecting = false;

function createSelectionDiv() {
    if (!selectionDiv) {
        selectionDiv = document.createElement('div');
        selectionDiv.className = 'selection-rectangle'; // Use a class for styling
        document.body.appendChild(selectionDiv);
        Object.assign(selectionDiv.style, {
            position: 'absolute',
            zIndex: '2147483647',
            border: '2px solid #5eeb57',
            display: 'none',
        });
    }
}

function updateSelectionDiv(x, y, width, height) {
    Object.assign(selectionDiv.style, {
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        display: 'block', // Make sure the div is visible
    });
}

function clearSelectionDiv() {
    selectionDiv.style.display = 'none'; // Hide the selection div
}

function activateSelectionMode() {
    createSelectionDiv();

    document.addEventListener('mousedown', (e) => {
        isSelecting = true;
        startX = e.pageX;
        startY = e.pageY;
        updateSelectionDiv(startX, startY, 0, 0);
    });

    document.addEventListener('mousemove', (e) => {
        if (isSelecting) {
            const width = e.pageX - startX;
            const height = e.pageY - startY;
            updateSelectionDiv(startX, startY, width, height);
        }
    });

    document.addEventListener('mouseup', () => {
        if (isSelecting) {
            isSelecting = false;
            captureSelectedArea();
            // Clear selection after capture
            clearSelectionDiv();
        }
    });

    console.log('Selection mode activated');
}

function captureSelectedArea() {
    html2canvas(document.body, {
        x: selectionDiv.offsetLeft,
        y: selectionDiv.offsetTop,
        width: selectionDiv.offsetWidth,
        height: selectionDiv.offsetHeight,
        useCORS: true,
        logging: true,
        scale: 1
    }).then(canvas => {
        const dataUrl = canvas.toDataURL();
        console.log('Area captured');
        chrome.runtime.sendMessage({action: 'capturedDataUrl', dataUrl: dataUrl});
    }).catch(error => {
        console.error('Error capturing selected area:', error);
    });
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'initiateAreaSelection') {
        activateSelectionMode();
        sendResponse({status: 'Selection mode activated'});
    }
});
