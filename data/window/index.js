'use strict';

// Grab the necessary DOM elements
const qrcode = new QRCode();
const scanButton = document.getElementById('scan-btn');
const localButton = document.getElementById('local-btn');
const imageInput = document.getElementById('image-input');
const imageDisplayArea = document.getElementById('image-display-area');
const resultDisplayArea = document.getElementById('result-display-area');
const resetButton = document.getElementById('reset-btn');

// Helper function to display image and results
const displayImageAndResult = (dataUrl, resultText) => {
  // Display the image
  const img = document.createElement('img');
  img.src = dataUrl;
  //img.style.maxWidth = '100%'; // Set max width to 100% of the parent
  //img.style.maxHeight = '100%'; // Set max height to 100% of the parent
  imageDisplayArea.innerHTML = ''; // Clear the display area first
  imageDisplayArea.appendChild(img);

  // Display the result
  resultDisplayArea.textContent = resultText;
};

// Function to process the image for QR code detection
const processImageForQRCode = (dataUrl) => {
  const img = new Image();
  img.crossOrigin = 'anonymous'; // Handle cross-origin images
  //let detectionTimeout;
  
  img.onload = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Fill the canvas with a white background to handle images with transparency
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the image onto the canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Optionally, apply preprocessing to the canvas here, if need for better QR code detection
    
    try {
      await qrcode.ready();
      qrcode.detect(canvas, canvas.width, canvas.height);

      // Set a timeout for QR code detection
      detectionTimeout = setTimeout(() => {
        resultDisplayArea.textContent = 'No QR Code';
      }, 10000); // 10 seconds timeout

    } catch (e) {
      console.error('QR Code detection error:', e);
    }
  };
  
  img.onerror = (e) => {
    console.error('Image load error:', e);
    // Handle image loading errors here
  };
  img.src = dataUrl;
};

// Add detection event listener to QRCode instance
qrcode.on('detect', e => {
  const resultText = e.data ? `QR Code Detected: ${e.data}` : 'No QR Code';
  resultDisplayArea.textContent = resultText;
  
  if (e.data && e.polygon) { // If QR code detected and polygon is available
    // Draw overlay on the detecteed QR code area
    const canvas = document.createElement('canvas'); // Create a canvas element
    const ctx = canvas.getContext('2d'); // Get the canvas context (drawing surface)
    canvas.width = img.naturalWidth; // Set canvas width to image width
    canvas.height = img.naturalHeight; // Set canvas height to image height

    // Draw the original image onto the canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw a red semi-transparent polygon over the QR code area
    ctx.fillStyle = 'rgba(255, 0, 0, 0.2)'; // Red, 20% opacity
    ctx.moveTo(e.polygon[0].x, e.polygon[0].y); // Move to the first vertex
    for (let i = 1; i < e.polygon.length; i++) { // Draw lines to the other vertices
      ctx.lineTo(e.polygon[i].x, e.polygon[i].y); // Draw line
    }                 
    ctx.closePath(); // Close the path
    ctx.fill(); // Fill the polygon

    // Replace the original image with the canvas
    imageDisplayArea.innerHTML = ''; // Clear the display area first
    imageDisplayArea.appendChild(canvas); // Display the canvas instead of the image
  }
});

// Event listener for the 'Scan' button
scanButton.addEventListener('click', () => {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
    if (chrome.runtime.lastError) {
    console.error('Error capturing the visible tab: ', chrome.runtime.lastError.message);
    resultDisplayArea.textContent = 'Error capturing the tab.';
    return;
    }
    processImageForQRCode(dataUrl);
    displayImageAndResult(dataUrl, 'Scanning...');
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
    processImageForQRCode(dataUrl);
    displayImageAndResult(dataUrl, 'Scanning...');
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