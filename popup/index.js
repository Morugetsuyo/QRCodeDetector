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
const processImageForQRCode = (dataUrl) => {
  displayImage(dataUrl); // Display the origian image (will be deprecated)
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
/*
if (typeof window.messageListenerAdded === 'undefined') {
  chrome.runtime.onMessage.addListener(function(request, _sender, sendResponse) {
    if (request.action === "processSelectedImage") {
      const dataUrl = request.dataUrl;
      processImageForQRCode(dataUrl);
      sendResponse({ status: "Selected image area is being processed" });
    }
    // Make sure to return true if you want to send a response asynchronously
    return true;
  });
  window.messageListenerAdded = true;
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('scan-btn').addEventListener('click', function() {
    resetPreviousWork();
    chrome.runtime.sendMessage({ action: "captureTab" }, function(response) {
      if (response && response.success) {
        console.log('Tab captured successfully.');
      } else {
        console.error('Failed to capture tab.');
      }
    });
  });
});
*/
document.addEventListener('DOMContentLoaded', function() {
  // Check for stored image data and process it if found
  chrome.storage.local.get(['selectedImageData'], function(result) {
    if (result.selectedImageData) {
      processImageForQRCode(result.selectedImageData);
      chrome.storage.local.remove(['selectedImageData'], () => {
        console.log('Selected image data removed.');
      });
    }
  });
  document.getElementById('scan-btn').addEventListener('click', function() {
    resetPreviousWork();
    chrome.runtime.sendMessage({ action: "captureTab" }, function(response) {
      if (response && response.success) {
        console.log('Tab captured successfully.');
      } else {
        console.error('Failed to capture tab.');
      }
    });
  });
});


localButton.addEventListener('click', () => {
  resetPreviousWork();
  imageInput.click(); 
});
    
imageInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      processImageForQRCode(e.target.result);
    };
    reader.readAsDataURL(file);
  } else {
    console.error('No file selected.');
  }
});

resetButton.addEventListener('click', resetPreviousWork);