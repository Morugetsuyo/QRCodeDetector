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
  displayImage(dataUrl); 
  displayResult('Scanning...'); 

  const img = new Image();
  img.crossOrigin = 'anonymous'; // Handle cross-origin images
  
  img.onload = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scaleFactor = 1; // Adjust as needed based on image resolution and QR code size
    canvas.width = img.naturalWidth * scaleFactor;
    canvas.height = img.naturalHeight * scaleFactor;

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Image preprocessing steps
    imageData = convertToGrayscale(imageData);
    imageData = applySharpen(imageData);
    imageData = adjustContrast(imageData);

    // Optional: Apply edge detection to enhance QR code edges
    imageData = applyEdgeDetection(imageData);

    ctx.putImageData(imageData, 0, 0);

    const processedDataUrl = canvas.toDataURL('image/png');
    displayImage(processedDataUrl);

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

function convertToGrayscale(imageData) {
  for (let i = 0; i < imageData.data.length; i +=4) {
    const gray = imageData.data[i] * 0.299 + imageData.data[i + 1] * 0.587 + imageData.data[i + 2] * 0.114;
    imageData.data[i] = imageData.data[i + 1] = imageData.data[i + 2] = gray;
  }
  return imageData;
}

function applySharpen(imageData) {
  const width = imageData.width;
  const height = imageData.height;
  const result = new ImageData(width, height);

  // A simplified approach to increase pixel contrast with its neighbors
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      // Simple sharpening: increase the contrast of the current pixel with its surrounding pixels
      result.data[i] = Math.min(255, Math.max(0, 1.5 * imageData.data[i] - 0.5 * (imageData.data[i - 4] + imageData.data[i + 4])));
      result.data[i + 1] = Math.min(255, Math.max(0, 1.5 * imageData.data[i + 1] - 0.5 * (imageData.data[i - 3] + imageData.data[i + 5])));
      result.data[i + 2] = Math.min(255, Math.max(0, 1.5 * imageData.data[i + 2] - 0.5 * (imageData.data[i - 2] + imageData.data[i + 6])));
      result.data[i + 3] = imageData.data[i + 3]; // Copy alpha channel
    }
  }
  return result;
}

function adjustContrast(imageData, contrast = 1.5) {
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] = factor * (imageData.data[i] - 128) + 128; // R
    imageData.data[i + 1] = factor * (imageData.data[i + 1] - 128) + 128; // G
    imageData.data[i + 2] = factor * (imageData.data[i + 2] - 128) + 128; // B
  }
  return imageData;
}

function applyEdgeDetection(imageData) {
  const width = imageData.width;
  const height = imageData.height; 
  const sobelKenrelX = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];
  const sobelKenrelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];

  function getPixelIntensity(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return 0;
    const index = (y * width + x) * 4;
    const r = imageData.data[index];
    const g = imageData.data[index + 1];
    const b = imageData.data[index + 2];
    // Convert to grayscale intensity
    return r * 0.3 + g * 0.59 + b * 0.11;
  }

  const result = new ImageData(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let gx = 0, gy = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const intensity = getPixelIntensity(x + dx, y + dy);
          gx += intensity * sobelKenrelX[dy + 1][dx + 1];
          gy += intensity * sobelKenrelY[dy + 1][dx + 1];
        }
      }
      const magnitude = Math.sqrt(gx * gx + gy * gy) >>> 0;
      const index = (y * width + x) * 4;
      result.data[index] = result.data[index + 1] = result.data[index + 2] = magnitude;
      result.data[index + 3] = 255; // Opaque alpha channel
    }
  }
  return imageData; 
}


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