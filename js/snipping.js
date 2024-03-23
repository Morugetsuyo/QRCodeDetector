window.onload = () => {
    const imageUrl = decodeURIComponent(window.location.hash.substring(1));
    const img = new Image();

    img.onload = () => {
        // Create the canvas and draw the image on it.
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        document.body.appendChild(img);

        // Create the selection overlay with improved visibility and initial size.
        const selectionOverlay = document.createElement('div');
        selectionOverlay.style.position = 'absolute';
        selectionOverlay.style.border = '2px solid red';
        selectionOverlay.style.pointerEvents = 'none';
        selectionOverlay.style.display = 'none';
        selectionOverlay.style.zIndex = '10'; // Ensure it is above the image.
        document.body.appendChild(selectionOverlay);

        let isDragging = false;
        let startX, startY;

        // Define mousemove handler as a named function to remove later.
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

        // Define mouseup handler as a named function to remove later.
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

            const selectionCanvas = document.createElement('canvas');
            const selectionCtx = selectionCanvas.getContext('2d');
            selectionCanvas.width = width;
            selectionCanvas.height = height;
            selectionCtx.drawImage(img, x, y, width, height, 0, 0, width, height);

            selectionCanvas.toBlob((blob) => {
                const selectedDataUrl = URL.createObjectURL(blob);
                // Send a message back to the background script with the selected area's data URL
                chrome.runtime.sendMessage({
                    action: "imageSelectedForQR",
                    dataUrl: selectedDataUrl
                }, (response) => {
                    if (response && response.success) {
                        console.log('Selected area sent for QR processing.');
                    } else {
                        console.error('Failed to send selected area for QR processing.');
                    }
                });
                URL.revokeObjectURL(selectedDataUrl);
                window.close(); // Close the window after the download is triggered.
            });

            // Clean up: remove the mousemove and mouseup handlers
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
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

            // Prevent the default mousedown action.
            e.preventDefault();

            // Bind mousemove and mouseup to the document to ensure they are captured.
            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
        });
    };

    img.src = imageUrl;
    img.style.position = 'absolute';
    img.style.left = '0';
    img.style.top = '0';
};
