'use strict';

// Grab the necessary DOM elements
const qrcode = new QRCode();
const scanButton = document.getElementById('scan-btn');
const localButton = document.getElementById('local-btn');
const imageInput = document.getElementById('image-input');
const imageDisplayArea = document.getElementById('image-display-area');
const resultDisplayArea = document.getElementById('result-display-area');
const resetButton = document.getElementById('reset-btn');
let img; // Global variable to hold the image

// Helper function to display image and results
const displayImageAndResult = (dataUrl, resultText) => {
  img = new Image(); // Initialize the global image variable
  img.src = dataUrl;
  imageDisplayArea.innerHTML = ''; // Clear the display area first
  imageDisplayArea.appendChild(img);

  // Display the result
  resultDisplayArea.textContent = resultText;
};

// Function to process the image for QR code detection
const processImageForQRCode = (dataUrl) => {
  // Ensure the img variable is initialized
  if (!img) {
    console.error('Image variable not initialized.');
    return;
  }

  img.crossOrigin = 'anonymous'; // Handle cross-origin images
  
  img.onload = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Fill the canvas with a white background
    ctx.fillStyle = '#fff'; // White
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the entire canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Draw the image onto the canvas
    
    try {
      await qrcode.ready();
      qrcode.detect(canvas, canvas.width, canvas.height);
    } catch (e) {
      console.error('QR Code detection error:', e);
    }
  };
  
  img.onerror = (e) => {
    console.error('Image load error:', e);
  };
  img.src = dataUrl;
};

// Add detection event listener to QRCode instance
qrcode.on('detect', e => {
  const resultText = e.data ? `QR Code Detected: ${e.data}` : 'No QR Code';
  resultDisplayArea.textContent = resultText;
  
  if (e.data && e.polygon && img) { // If QR code detected and image loaded
    console.log('QR Code detected:', e.data);

    // Debugging: Log image dimentions and polygon points
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
  }
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
    
    document.addEventListener('DOMContentLoaded', () => {
    // Initialize any additional listeners or startup procedures here
    });

// Event listener for the 'Reset' button
resetButton.addEventListener('click', () => {
  // Claer image and result display areas
  imageDisplayArea.innerHTML = 'Image will be displayed here';
  resultDisplayArea.textContent = 'Result will be displayed here';
  // Reset any additional state or variables if needed
});