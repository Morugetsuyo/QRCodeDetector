'use strict';

// Grab the necessary DOM elements
const imageDisplayArea = document.getElementById('image-display-area');
const resultDisplayArea = document.getElementById('result-display-area');
const imageInput = document.getElementById('image-input');
const scanButton = document.getElementById('scan-btn');
const localButton = document.getElementById('local-btn');
const resetButton = document.getElementById('reset-btn');

const qrcode = new QRCode();

// Helper function to display image and results
const displayImage = (dataUrl) => {
  const imageArea = document.getElementById('image-display-area');
  imageArea.innerHTML = ''; // Clear the image area first
  const img = document.createElement('img');
  img.src = dataUrl;
  imageArea.appendChild(img);
};

// Helper function to display results
const displayResult = (resultText) => {
  //Display the result
  resultDisplayArea.textContent = resultText;
};


// Function to process the image for QR code detection
const processImageForQRCode = async (dataUrl) => {
  displayImage(dataUrl); // Display the image immediately
  displayResult('Scanning...'); // Show scanning message

  const img = new Image();
  img.crossOrigin = 'anonymous'; // Handle cross-origin images
  
  img.onload = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    // Optionally adjust the image size if it's too small
    const scaleFactor = 1; // Adjust as needed based on image resolution and QR code size
    canvas.width = img.naturalWidth * scaleFactor;
    canvas.height = img.naturalHeight * scaleFactor;

    // Fill the canvas with a white background to handle images with transparency
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // Using luminosity method
    for (let i = 0; i < imageData.data.length; i += 4) {
      const gray = imageData.data[i] * 0.299 + imageData.data[i + 1] * 0.587 + imageData.data[i + 2] * 0.144;
      imageData.data[i] = gray;
      imageData.data[i + 1] = gray;
      imageData.data[i + 2] = gray;
    }
    ctx.putImageData(imageData, 0, 0);

    // Apply sharpening filter
    // This is a simple sharpen effect -> consider using a convolution filter
    ctx.filter = 'contrast(120%)';
    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height)


    try {
      await qrcode.ready();
      const detectionResults = await qrcode.detect(canvas, canvas.width, canvas.height);
      displayResult(detectionResults.length > 0 ? `QR Code Detected: ${detectionResults[0].data}` : 'No QR code');
    } catch (error) {
      console.error('QR Code detection error or timeout:', error);
      displayResult(error.toString());
    }
  };

  img.onerror = (e) => {
    console.error('Image load error:', e);
    displayResult('Image load error');
  };

  img.src = dataUrl;
};

// Add detection event listener to QRCode instance
qrcode.on('detect', e => {
  const resultText = e.data ? `QR Code Detected: ${e.data}` : 'No QR Code';
  displayResult(resultText);
});

// Function to reset previous work
const resetPreviousWork = () => {
  imageDisplayArea.innerHTML = 'Image will be displayed here';
  resultDisplayArea.textContent = 'Result will be displayed here';
  qrcode.resetDetection();
  imageInput.value = '';
}

// Event listener for the 'Scan' button
scanButton.addEventListener('click', () => {
  resetPreviousWork();
  chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
    if (chrome.runtime.lastError) {
      console.error('Error capturing the visible tab: ', chrome.runtime.lastError.message);
      displayResult('Error capturing the tab.');
      return;
    }
    processImageForQRCode(dataUrl);
  });
});
    
// Event listener for the 'Local' button to trigger the hidden file input
localButton.addEventListener('click', () => {
  resetPreviousWork();
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