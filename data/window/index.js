
  // Grab the necessary DOM elements
  const qrcode = new QRCode();
  const scanButton = document.getElementById('scan-btn');
  const localButton = document.getElementById('local-btn');
  const imageInput = document.getElementById('image-input');
  const imageDisplayArea = document.getElementById('image-display-area');
  const resultDisplayArea = document.getElementById('result-display-area');
  const resetButton = document.getElementById('reset-btn');
  const canvas = document.getElementById('qr-canvas');
  let img; // Global variable to hold the image

    // Helper function to display image and results
    const displayImageAndResult = (dataUrl) => {
      img = new Image(); // Initialize the global image variable
      img.src = dataUrl;
      imageDisplayArea.innerHTML = '<p>Analyzing...</p>';
      img.onload = () => {
        imageDisplayArea.innerHTML = ''; // Clear the "Analyzing..." text
        imageDisplayArea.appendChild(img);
        if (img.complete && img.naturalHeight !== 0) {
          canvas.width = Math.round(img.naturalWidth);
          canvas.height = Math.round(img.naturalHeight);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          processImageForQRCode(dataUrl);
        } else {
          console.error('Image not fully loaded.');
        }
      };
    }; // Add a closing parenthesis here

    // Function to process the image for QR code detection
    const processImageForQRCode = async (dataUrl, trial = 1) => {
      if (!img) {
        console.error('Image variable not initialized.');
        return;
      }
      
      img.crossOrigin = 'anonymous'; // Handle cross-origin images
      img.onload = async () => {
        const canvas = document.getElementById('qr-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = Math.round(img.naturalWidth);
        canvas.height = Math.round(img.naturalHeight);
        ctx.fillStyle = '#fff'; // White
        ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the entire canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Draw the image onto the canvas
      
        try {
          await qrcode.ready();
          const result = await qrcode.detect(canvas);
          console.log(canvas.width, canvas.height);
          
          if (result) {
            highlightAndCenterQRCode(result);
            return;
          } else if (trial < 3) {
            processImageForQRCode(dataUrl, trial + 1);
          } else {
            fitImageInDisplayArea();
          } 
        } catch (e) {
          console.error('QR Code detection error:', e);
        }
      };
      img.src = dataUrl;
    };
    
    
    function highlightAndCenterQRCode(qrCode) {
      const overlayCanvas = document.createElement('canvas');
      const overlayCtx = overlayCanvas.getContext('2d');
      overlayCanvas.width = img.width;
      overlayCanvas.height = img.height;

      overlayCtx.drawImage(img, 0, 0); // Draw the image onto the overlay canvas
      overlayCtx.strokeStyle = 'rgba(100, 255, 100, 1)'; // Green outline color
      overlayCtx.lineWidth = 3;
      overlayCtx.beginPath(); // Begin a new path
      overlayCtx.moveTo(qrCode.polygon[0].x, qrCode.polygon[0].y); // Move to the first vertex
      qrCode.polygon.forEach((point, index) => {
        if (index > 0) {
          overlayCtx.lineTo(point.x, point.y); // Draw lines to the other vertices
        }
      });                 
      overlayCtx.closePath(); // Close the path
      overlayCtx.stroke(); // Fill the path

      centerAndResizeQRCode(qrCode, overlayCanvas);
    }

    function centerAndResizeQRCode(qrCode, overlayCanvas) {
      // Calculate the bounding box of the QR Code
      let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
      qrCode.polygon.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
      
      const qrWidth = maxX - minX;
      const qrHeight = maxY - minY;

      // Calculate scale and shift to center the QR Code in the display area
      const scaleX = imageDisplayArea.clientWidth / qrWidth;
      const scaleY = imageDisplayArea.clientHeight / qrHeight;
      const scale = Math.min(scaleX, scaleY);
      const shiftX = (imageDisplayArea.clientWidth - qrWidth * scale) / 2 - minX * scale;
      const shiftY = (imageDisplayArea.clientHeight - qrHeight * scale) / 2 - minY * scale;

      overlayCanvas.style.transform = `translate(${shiftX}px, ${shiftY}px) scale(${scale})`;

      imageDisplayArea.innerHTML = '';
      imageDisplayArea.appendChild(overlayCanvas);
    }


    function fitImageInDisplayArea() {
      imageDisplayArea.innerHTML = '';
      const displayCanvas = document.createElement('canvas');
      const displayCtx = displayCanvas.getContext('2d');
      
      // Set canvas size to the size of the display area
      displayCanvas.width = imageDisplayArea.clientWeight;
      displayCanvas.height = imageDisplayArea.clientHeight;

      // Calculate scale to fit the image within the display area
      const scale = Math.min(
        imageDisplayArea.clientWidth / img.width,
        imageDisplayArea.clientHeight / img.height
      );

      // Center the image in the canvas
      const x = (imageDisplayArea.clientWidth - img.width * scale) / 2;
      const y = (imageDisplayArea.clientHeight - img.height * scale) / 2;

      displayCtx.drawImage(img, x, y, img.width * scale, img.height * scale);

      imageDisplayArea.appendChild(displayCanvas);
    }

    // Event listener for the 'Scan' button
    scanButton.addEventListener('click', () => {
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          console.error('Error capturing the visible tab: ', chrome.runtime.lastError.message);
          resultDisplayArea.textContent = 'Error capturing the tab.';
          return;
        }
        displayImageAndResult(dataUrl, 'Scanning...'); // Initilaize img first
        processImageForQRCode(dataUrl); // Then procesqs the image for QR code detection
      });
    });
    
    // Event listener for the 'Local' button to trigger the hidden file input
    localButton.addEventListener('click', () => {
      imageInput.click(); // Simulate a click on the hidden file input
    });
    
    // Event listener for file input change to handle local image file selection
    imageInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) {
        console.error('No file selected.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        displayImageAndResult(dataUrl, 'Scanning...');
        processImageForQRCode(dataUrl);
      };
      reader.readAsDataURL(file);
    });
    
    // Event listener for the 'Reset' button
    resetButton.addEventListener('click', () => {
      // Claer image and result display areas
      imageDisplayArea.innerHTML = 'Image will be displayed here';
      resultDisplayArea.textContent = 'Result will be displayed here';
      // Reset any additional state or variables if needed
    });


    // Add detection event listener to QRCode instance
    /*
    qrcode.on('detect', e => {
      const resultText = e.data ? `QR Code Detected: ${e.data}` : 'No QR Code detected';
      resultDisplayArea.textContent = resultText;
      
      if (e.data && e.polygon && img) { // If QR code detected and image loaded
        console.log('QR Code detected:', e.data);
        console.log('Image dimentions:', img.width, img.height);
        console.log('Polygon points:', e.polygon);  
        const overlayCanvas = document.createElement('canvas'); // Create a canvas for the overlay
        const overlayCtx = overlayCanvas.getContext('2d'); // Get the context of the overlay canvas

        // Ensure the overlay canvas is positioned over the image
        overlayCanvas.style.position = 'absolute';  
        overlayCanvas.style.top = '0';
        overlayCanvas.style.left = '0';
        overlayCanvas.style.zIndex = '1'; // Ensure the overlay is on top of the image

        overlayCanvas.width = img.width; // Set canvas width to image width
        overlayCanvas.height = img.height; // Set canvas height to image height

        overlayCtx.drawImage(img, 0, 0); // Draw the image onto the overlay canvas
        overlayCtx.fillStyle = 'rgba(255, 0, 0, 0.2)'; // Red, 20% opacity
        overlayCtx.beginPath(); // Begin a new path
        overlayCtx.moveTo(e.polygon[0].x, e.polygon[0].y); // Move to the first vertex
        e.polygon.forEach((point, index) => {
          if (index > 0) {
            overlayCtx.lineTo(point.x, point.y); // Draw lines to the other vertices
          }
        });
        overlayCtx.closePath(); // Close the path
        overlayCtx.fill(); // Fill the path
        
        // Debugging: Log overlay canvas dimentions
        console.log('Overlay canvas dimentions:', overlayCanvas.width, overlayCanvas.height);

        // Replace the original image with the canvas
        imageDisplayArea.innerHTML = ''; // Clear the display area first
        imageDisplayArea.appendChild(overlayCanvas); // Display the overlay canvas
      } else {
        // If no QR code is detected, fit the image in the display area
        imageDisplayArea.innerHTML = ''; // Clear the "Analyzing..." text
        imageDisplayArea.appendChild(img);
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
      }
    });
  });

  function centerQRCodeInDisplayArea() {
    if (!e.polygon || e.polygon.length === 0) {
      console.error('No QR Code polygon data available for centering.')
      return;
    }

    // Calculate the center of the QR Code polygon
    let sumX = 0, sumY = 0;
    e.polygon.forEach(point => {
      sumX += point.x;
      sumY += point.y;
    });
    const centerX = sumX / e.polygon.length;
    const centerY = sumY / e.polygon.length;

    // Calculate the center of the imageDisplayArea
    const displayAreaCenterX = imageDisplayArea.clientWidth / 2;
    const displayAreaCenterY = imageDisplayArea.clientHeight / 2;

    // Determine the shift required to center the QR Code polygon
    const shiftX = displayAreaCenterX - centerX;
    const shiftY = displayAreaCenterY - centerY;

    overlayCanvas.style.transform = `translate(${shiftX}px, ${shiftY}px)`;
  }

function resizeAndTrimImageToFitQRCode() {
  if (!e.polygon || e.polygon.length === 0) {
    console.error('No QR Code polygon data available for resizing.')
    return;
  }

  // Calculate the bounding box of the QR Code polygon
  let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
  e.polygon.forEach(point => {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  });

  const qrWidth = maxX - minX;
  const qrHeight = maxY - minY;

  // Determine the scaling factor required to fit the QR Code polygon within the image-display-area
  const scaleX = imageDisplayArea.clientWidth / qrWidth;
  const scaleY = imageDisplayArea.clientHeight / qrHeight;
  const scale = Math.min(scaleX, scaleY);

  overlayCanvas.width = img.width * scale;
  overlayCanvas.height = img.height * scale;
  overlayCanvas.style.transform = `scale(${scale})`;
}
*/

  qrcode.on('detect', e => {
    const resultText = e.data ? `QR Code Detected: ${e.data}` : 'No QR Code detected';
    resultDisplayArea.textContent = resultText;

    if (e.data && e.polygon && img) {
      // Log for debugging
      console.log('QR Code detected:', e.data);
      console.log('Image dimensions:', img.width, img.height);
      console.log('Polygon points:', e.polygon);

      // Process QR code detection
      processQRCodeDetection(e);
    } else {
      // No QR code detected, display image normally
      displayImageNormally();
    }
  });

  function processQRCodeDetection(e) {
    const overlayCanvas = document.createElement('canvas');
    const overlayCtx = overlayCanvas.getContext('2d');
    overlayCanvas.width = img.width;
    overlayCanvas.height = img.height;

    // Draw the image onto the overlay canvas
    overlayCtx.drawImage(img, 0, 0);
    highlightQRCode(e, overlayCtx);
    centerAndResizeQRCode(e, overlayCanvas);

    // Replace the original image with the canvas
    imageDisplayArea.innerHTML = '';
    imageDisplayArea.appendChild(overlayCanvas);
  }

  function highlightQRCode(e, overlayCtx) {
    // Draw the highlight on the QR code
    overlayCtx.fillStyle = 'rgba(255, 0, 0, 0.2)';
    overlayCtx.beginPath();
    overlayCtx.moveTo(e.polygon[0].x, e.polygon[0].y);
    e.polygon.forEach((point, index) => {
      if (index > 0) {
        overlayCtx.lineTo(point.x, point.y);
      }
    });
    overlayCtx.closePath();
    overlayCtx.fill();
  }

  function centerAndResizeQRCode(e, overlayCanvas) {
    // Center and resize QR code
    const boundingBox = calculateBoundingBox(e.polygon);
    const scale = calculateScale(boundingBox, imageDisplayArea);
    const shift = calculateShift(boundingBox, scale, imageDisplayArea);

    overlayCanvas.style.transform = `translate(${shift.x}px, ${shift.y}px) scale(${scale})`;
  }

  function displayImageNormally() {
    imageDisplayArea.innerHTML = '';
    imageDisplayArea.appendChild(img);
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
  }

  // Helper functions: calculateBoundingBox, calculateScale, calculateShift
  // ... (Implement these functions based on the logic in centerQRCodeInDisplayArea and resizeAndTrimImageToFitQRCode)


// Event listeners for buttons (Scan, Local, Reset)
// ... (Keep the existing event listener code for buttons)
