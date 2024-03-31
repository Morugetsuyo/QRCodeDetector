function enableQRSelection(img) {
    const selectionOverlay = document.createElement('div');
    selectionOverlay.style.position = 'absolute';
    selectionOverlay.style.border = '2px solid red';
    selectionOverlay.style.pointerEvents = 'none';
    selectionOverlay.style.display = 'none';
    selectionOverlay.style.zIndex = '10'; // Ensure it is above the image
    document.body.appendChild(selectionOverlay);

    let isDragging = false;
    let startX, startY;

    const mouseMoveHandler = (e) => {
        if (!isDragging) return;

        // Updated: Recalculate imgRect here to ensure it's up-to-date
        const imgRect = img.getBoundingClientRect();

        const mouseX = e.pageX;
        const mouseY = e.pageY;
        const offsetX = mouseX - imgRect.left - window.scrollX;
        const offsetY = mouseY - imgRect.top - window.scrollY;

        const width = offsetX - startX;
        const height = offsetY - startY;

        selectionOverlay.style.width = `${Math.abs(width)}px`;
        selectionOverlay.style.height = `${Math.abs(height)}px`;
        selectionOverlay.style.left = `${Math.min(startX + imgRect.left + window.scrollX, mouseX)}px`;
        selectionOverlay.style.top = `${Math.min(startY + imgRect.top + window.scrollY, mouseY)}px`;
    };

    const mouseUpHandler = (e) => {
        if (!isDragging) return;

        isDragging = false;
        
        // Moved inside mouseUpHandler to ensure it's defined
        const imgRect = img.getBoundingClientRect();
        
        const bounds = selectionOverlay.getBoundingClientRect();
        const scaleX = img.naturalWidth / img.width;
        const scaleY = img.naturalHeight / img.height;
        const x = (bounds.left - imgRect.left - window.scrollX) * scaleX;
        const y = (bounds.top - imgRect.top - window.scrollY) * scaleY;
        const width = bounds.width * scaleX;
        const height = bounds.height * scaleY;

        // Process the selected area for QR code detection
        processSelectedArea(img, x, y, width, height);

        // Clean up: remove the mousemove and mouseup handlers and hide the overlay
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
        selectionOverlay.style.display = 'none';
    };

    img.addEventListener('mousedown', (e) => {
        isDragging = true;
        
        // Calculate the initial position here, at the start of the drag
        const imgRect = img.getBoundingClientRect();
        startX = e.pageX - imgRect.left - window.scrollX;
        startY = e.pageY - imgRect.top - window.scrollY;

        selectionOverlay.style.width = '0';
        selectionOverlay.style.height = '0';
        selectionOverlay.style.left = `${e.pageX}px`; // This needs correction based on new startX calculation
        selectionOverlay.style.top = `${e.pageY}px`; // This needs correction based on new startY calculation
        selectionOverlay.style.display = 'block';

        // Bind mousemove and mouseup to the document to ensure they are captured
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
        e.preventDefault(); // Prevent default to avoid any unwanted behavior
    });
};

function processSelectedArea(image, x, y, width, height) {
    const selectionCanvas = document.createElement('canvas');
    const selectionCtx = selectionCanvas.getContext('2d');
    selectionCanvas.width = width;
    selectionCanvas.height = height;
    selectionCtx.drawImage(image, x, y, width, height, 0, 0, width, height);

    const dataUrl = selectionCanvas.toDataURL();
    document.dispatchEvent(new CustomEvent('captureCompleted', {detail: dataUrl}));
}