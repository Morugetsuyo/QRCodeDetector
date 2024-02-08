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
  const imageArea = document.getElementById('image-display-area');
  imageArea.innerHTML = ''; // Clear the image area first
  const img = document.createElement('img');
  img.src = dataUrl;
  imageArea.appendChild(img);

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
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Optionally, apply preprocessing to the canvas here, if need for better QR code detection
    
    try {
      await qrcode.ready();
      await qrcode.detect(canvas, canvas.width, canvas.height);
    } catch (e) {
      console.error('QR Code detection error or timeout:', e);
      displayImageAndResult(dataUrl, e.toString());
    }
  };
  img.onerror = (e) => {
    console.error('Image load error:', e);
    displayImageAndResult(dataUrl, 'Image load error');
  };
  img.src = dataUrl;
};

// Add detection event listener to QRCode instance
qrcode.on('detect', e => {
  const resultText = e.data ? `QR Code Detected: ${e.data}` : 'No QR Code';
  displayImageAndResult(imageInput.value, resultText);
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
  imageDisplayArea.innerHTML = 'Image will be displayed here';
  resultDisplayArea.textContent = 'Result will be displayed here';
  qrcode.resetDetection();
  imageInput.value = '';
});