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
const imageProcessingWorker = new Worker('web_worker.js');

// Function to handle messages from the worker, including processed images
imageProcessingWorker.onmessage = async function(event) {
  const { action, processedDataUrl } = event.data;
  if (action === 'imageProcessed') {
    displayImage(processedDataUrl); // Display the processed image

    // Immediately proceed to QR code detection with the processed image
    detectQRCodeFromProcessedDataUrl(processedDataUrl);
  }
};

// Function to process the image for QR code detection, including sending the image to the worker
const processImageForQRCode = (dataUrl) => {
  displayImage(dataUrl); // Optionally display the original image or a loading indicator
  displayResult('Processing image...');

  // Convert the data URL to a blob and send it to the worker for processing
  fetch(dataUrl)
    .then(response => response.blob())
    .then(blob => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(blob);
      reader.onloadend = () => {
        // Post the image data to the worker for processing
        imageProcessingWorker.postMessage({ action: 'processImage', imageData: reader.result }, [reader.result]);
      };
    });
};

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