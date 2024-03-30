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

        const mouseX = e.pageX;
        const mouseY = e.pageY;
        const imgRect = img.getBoundingClientRect();
        const imgX = imgRect.left + window.scrollX;
        const imgY = imgRect.top + window.scrollY;
        const offsetX = mouseX - imgX;
        const offsetY = mouseY - imgY;
        const width = offsetX - startX;
        const height = offsetY - startY;

        selectionOverlay.style.width = `${Math.abs(width)}px`;
        selectionOverlay.style.height = `${Math.abs(height)}px`;
        selectionOverlay.style.left = `${startX + (width < 0 ? width : 0)}px`;
        selectionOverlay.style.top = `${startY + (height < 0 ? height : 0)}px`;
    };

    const mouseUpHandler = (e) => {
        if (!isDragging) return;

        isDragging = false;
        const bounds = selectionOverlay.getBoundingClientRect();
        const scaleX = img.naturalWidth / img.width;
        const scaleY = img.naturalHeight / img.height;
        const x = (bounds.left - img.offsetLeft) * scaleX;
        const y = (bounds.top - img.offsetTop) * scaleY;
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
        startX = e.offsetX;
        startY = e.offsetY;
        selectionOverlay.style.width = '0';
        selectionOverlay.style.height = '0';
        selectionOverlay.style.left = `${startX}px`;
        selectionOverlay.style.top = `${startY}px`;
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

    selectionCanvas.toBlob((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'captured-image.png'; // You can choose the filename
        a.click();
    });
}

