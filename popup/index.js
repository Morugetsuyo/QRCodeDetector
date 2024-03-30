'use strict';

// Grab the necessary DOM elements
const imageDisplayArea = document.getElementById('image-display-area');
const resultDisplayArea = document.getElementById('result-display-area');
const imageInput = document.getElementById('image-input');
const scanButton = document.getElementById('scan-btn');
const localButton = document.getElementById('local-btn');
const resetButton = document.getElementById('reset-btn');
const exitButton = document.getElementById('exit-btn');

const qrcode = new QRCode();

// Helper function to display image and results
function displayImage(dataUrl) {
  imageDisplayArea.innerHTML = ''; // Clear the image area first
  const img = document.createElement('img');
  img.src = dataUrl;
  imageDisplayArea.appendChild(img);
}

// Helper function to display results
const displayResult = (resultText) => {
  resultDisplayArea.textContent = resultText;
};

// Initialize an image processing web worker
const imageProcessingWorker = new Worker("web_worker.js");
imageProcessingWorker.onmessage = async function(event) {
  const { action, processedDataUrl } = event.data;
  if (action === 'imageProcessed') {
    displayImage(processedDataUrl); 
    detectQRCodeFromProcessedDataUrl(processedDataUrl);
  }
};

// Processes the image for QR Code detection
window.processImageForQRCode = function(dataUrl) {
  // Convert Data URL to Blob, then post to web worker
  fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
          imageProcessingWorker.postMessage({action: "processImage", imageData: blob});
      });
}

// Make the function globally accessible if needed by `snipping.js`
window.processImageForQRCode = processImageForQRCode;

// Helper function to initiate QR code detection on a processed image
async function detectQRCodeFromProcessedDataUrl(processedDataUrl) {
  try {
    const imageBitmap = await createImageBitmap(await (await fetch(processedDataUrl)).blob());
    await qrcode.ready();
    const detectionResults = await qrcode.detect(imageBitmap, imageBitmap.width, imageBitmap.height);
    displayResult(detectionResults.length > 0 ? `QR Code Detected: ${detectionResults[0].data}` : 'No QR code found');
  } catch (error) {
    console.error('QR Code detection error or timeout:', error);
    displayResult(`Error during detection: ${error.toString()}`);
  }
}

// Event listener to QRCode detection
qrcode.on('detect', e => {
  const resultText = e.data ? `QR Code Detected: ${e.data}` : 'No QR Code';
  displayResult(resultText);
});

const resetPreviousWork = () => {
  imageDisplayArea.innerHTML = 'Image will be displayed here';
  resultDisplayArea.textContent = 'Result will be displayed here';
  qrcode.resetDetection();
  imageInput.value = '';
};





document.getElementById('local-btn').addEventListener('click', () => {
  // Reset previous work if any
  resetPreviousWork();

  // Create a file input element and trigger click event to open file dialog
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        // Display the local image in image-display-area
        displayImage(event.target.result);
        // Remove previously captured image if needed
      };
      reader.readAsDataURL(file);
    }
  };
  fileInput.click();
});

resetButton.addEventListener('click', resetPreviousWork);



document.addEventListener('DOMContentLoaded', () => {
  const imageDisplayArea = document.getElementById('image-display-area');
  const imageUri = decodeURIComponent(window.location.hash.substring(1));
  
  if (imageUri) {
    const img = document.createElement('img');
    img.src = imageUri;
    imageDisplayArea.innerHTML = '';
    imageDisplayArea.appendChild(img);

    img.onload = () => {
      enableQRSelection(img);
    };
  }
});


document.getElementById('exit-btn').addEventListener('click', () => {
  window.close();
});





