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
  imageDisplayArea.innerHTML = ''; // Clear the image area first
  const img = document.createElement('img');
  img.src = dataUrl;
  imageDisplayArea.appendChild(img);
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
    detectQRCodeFromProcessedDataUrl(processedDataUrl); // Immediately proceed to QR code detection with the processed image
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

// Screen are capture logic - Start
let startX, startY, endX, endY;
const selectionRectangle = document.createElement('div');
selectionRectangle.className = 'selection-rectangle';
document.body.appendChild(selectionRectangle);

const updateSelectionRectangle = () => {
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(startX - endX);
  const height = Math.abs(startY - endY);
  selectionRectangle.style.left = `${x}px`;
  selectionRectangle.style.top = `${y}px`;
  selectionRectangle.style.width = `${width}px`;
  selectionRectangle.style.height = `${height}px`;
};

scanButton.addEventListener('click', () => {
  resetPreviousWork();
  document.body.appendChild(selectionRectangle);
  let isDrawing = false; // Allow users to draw a rectangle on the screen

  const startDrawing = (e) => {
    isDrawing = true;
    startX = e.pageX;
    startY = e.pageY;
    selectionRectangle.style.display = 'block';
  };

  const stopDrawing = () => {
    if (isDrawing) {
      document.removeEventListener('mousemove', onMouseMove);
      isDrawing = false;
      captureSelectedArea();
    }
  };

  const onMouseMove = (e) => {
    if (!isDrawing) return;
    endX = e.pageX;
    endY = e.pageY;
    updateSelectionRectangle();
  }
  
  const captureSelectedArea = () => {
    const rect = selectionRectangle.getBoundingClientRect();
    html2canvas(document.body, {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY, // Corrected from `rect.left` to `rect.top` for the `y` property
      width: rect.width,
      height: rect.height,
      useCORS: true,
      logging: true,
      letterRendering: 1,
      allowTaint: false,
    }).then((canvas) => {
      const dataUrl = canvas.toDataURL(); // Corrected method name
      processImageForQRCode(dataUrl); // process the captured image immediately
      selectionRectangle.style.display = 'none'; // Hide after capturing
    }).catch((error) => {
      console.error('Error capturing area:', error);
    });
};


  document.addEventListener('mousedown', startDrawing, { once: true });
  document.addEventListener('mouseup', stopDrawing, { once: true });
  document.addEventListener('mousemove', onMouseMove);
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