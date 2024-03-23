var overlay, selectionFeedback;
var startX, startY, endX, endY;
var isDrawing = false;

// Listen for a message from the popup to inject and initialize the script
chrome.runtime.onMessage.addListener(function(request, _sender, sendResponse) {
    if (request.action === 'initiatecapture') {
        // Only call initSelectionTools if it has not been initialized
        if (!overlay && !selectionFeedback) {
            initSelectionTools();
        }
        sendResponse({status: "Script injected and initialized"});
    }
    else if (request.action === 'reset') {
        // Call resetCapture if a reset is requested
        resetCapture();
        sendResponse({status: "Capture reset"});
    }
});

function initSelectionTools() {
    // Create the overlay elements
    overlay = document.createElement('div');
    selectionFeedback = document.createElement('div');

    // Set attributes and styles
    setOverlayAttributes();
    setSelectionFeedbackAttributes();

    // Append to document body
    document.body.appendChild(overlay);
    document.body.appendChild(selectionFeedback);

    // Attach event listeners
    attachEventListeners();
}

function setOverlayAttributes() {
    overlay.setAttribute('id', 'extension-overlay');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.zIndex = '10000';
    overlay.style.cursor = 'crosshair';
}

function setSelectionFeedbackAttributes() {
    selectionFeedback.setAttribute('id', 'extension-selectionFeedback');
    selectionFeedback.style.position = 'fixed';
    selectionFeedback.style.border = '2px dashed red';
    selectionFeedback.style.zIndex = '10001';
}

function attachEventListeners() {
    overlay.addEventListener('mousedown', startDrawing, true);
    document.addEventListener('mousemove', drawSelection, true);
    document.addEventListener('mouseup', finishDrawing, true);
}

function startDrawing(e) {
    isDrawing = true;
    startX = e.pageX;
    startY = e.pageY;
}

function drawSelection(e) {
    if (!isDrawing) return;

    endX = e.pageX;
    endY = e.pageY;
    updateSelectionFeedback();
}

function updateSelectionFeedback() {
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    const left = Math.min(endX, startX);
    const top = Math.min(endY, startY);

    selectionFeedback.style.width = `${width}px`;
    selectionFeedback.style.height = `${height}px`;
    selectionFeedback.style.left = `${left}px`;
    selectionFeedback.style.top = `${top}px`;
    selectionFeedback.style.display = 'block';
}

function finishDrawing() {
    if (!isDrawing) return;
    isDrawing = false;

    captureSelectedArea().then(resetCapture);
}

function captureSelectedArea() {
    return html2canvas(document.body, {
        x: startX,
        y: startY,
        width: Math.abs(endX - startX),
        height: Math.abs(endY - startY),
        useCORS: true,
        logging: true,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight
    }).then(canvas => {
        const dataUrl = canvas.toDataURL('image/png');
        chrome.runtime.sendMessage({action: "imageCaptured", dataUrl: dataUrl});
    });
}

function resetCapture() {
    if (overlay && selectionFeedback) {
        overlay.remove();
        selectionFeedback.remove();
    }
    overlay = null;
    selectionFeedback = null;
    isDrawing = false;
    startX = startY = endX = endY = 0;
}