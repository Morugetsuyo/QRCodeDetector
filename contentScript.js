'use strict';

let selectionDiv;
let startX, startY, isSelecting = false;

function createSelectionDiv() {
    if (!selectionDiv) {
        selectionDiv = document.createElement('div');
        selectionDiv.id = 'selection-rectangle';
        document.body.appendChild(selectionDiv);
        selectionDiv.style.position = 'absolute';
        selectionDiv.style.zIndex = 2147483647;
        selectionDiv.style.border = '2px dashed #5eeb57';
        selectionDiv.style.display = 'none';
    }
}

function updateSelectionDiv(x, y, width, height) {
    selectionDiv.style.left = `${x}px`;
    selectionDiv.style.top = `${y}px`;
    selectionDiv.style.width = `${Math.abs(width)}px`;
    selectionDiv.style.height = `${Math.abs(height)}px`;
    selectionDiv.style.display = 'block';
}

function clearSelectionDiv() {
    selectionDiv.style.display = 'none';
}

function captureSelectedArea() {
    if (!selectionDiv) {
        return;
    }

    html2canvas(document.body, {
        x: window.scrollX + selectionDiv.offsetLeft,
        y: window.scrollY + selectionDiv.offsetTop,
        width: selectionDiv.offsetWidth,
        height: selectionDiv.offsetHeight,
        useCORS: true,
        logging: true,
        scale: 1,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight
    }).then(canvas => {
        const dataUrl = canvas.toDataURL('image/png');
        chrome.runtime.sendMessage({ action: 'captureDataUrl', dataUrl: dataUrl });
    }).catch(error => {
        console.error('Error capturing selected area:', error);
    });
}

function activateSelectionMode() {
    createSelectionDiv();

    document.addEventListener('mousedown', (e) => {
        isSelecting = true;
        startX = e.pageX;
        startY = e.pageY;
        updateSelectionDiv(startX, startY, 0, 0);
    }, { once: true });

    document.addEventListener('mousemove', (e) => {
        if (isSelecting) {
            const width = e.pageX - startX;
            const height = e.pageY - startY;
            updateSelectionDiv(startX, startY, width, height);
        }
    }, { once: true });

    document.addEventListener('mouseup', (e) => {
        if (isSelecting) {
            isSelecting = false;
            captureSelectedArea();
            clearSelectionDiv();
        }
        document.removeEventListener('mousemove', this);
    }, { once: true });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'activateSelectionMode') {
        activateSelectionMode();
        sendResponse({status: 'Selection mode activated'});
    }
});
