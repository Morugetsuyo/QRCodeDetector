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
  resultDisplayArea.textContent = resultText;
};

const imageProcessingWorker = new Worker('web_worker.js');
imageProcessingWorker.onmessage = async function(event) {
  const { action, processedDataUrl } = event.data;
  if (action === 'imageProcessed') {
    displayImage(processedDataUrl); 
    detectQRCodeFromProcessedDataUrl(processedDataUrl);
  }
};

// Function to process the image for QR code detection, including sending the image to the worker
const processImageForQRCode = (dataUrl) => {
  displayImage(dataUrl); // Optionally display the original image or a loading indicator
  displayResult('Processing image...');

  // Convert the data URL to a blob and send it to the worker for processing(web_worker.js)
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
const detectQRCodeFromProcessedDataUrl = async (processedDataUrl) => {
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

function cropImage(dataUrl, coords) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = coords.width;
      canvas.height = coords.height;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(image, coords.x, coords.y, coords.width, coords.height, 0, 0, coords.width, coords.height);

      resolve(canvas.toDataURL());
    };
    image.onerror = reject;
    image.src = dataUrl;
  });
}


scanButton.addEventListener('click', () => {
  resetPreviousWork();

  chrome.runtime.sendMessage({ action: 'enableAreaSelection' }, (response) => {
    if (response && response.success) {
      console.log('Area selection initiated.');
    } else {
      console.error('Error during area selection:', response.error);
      displayResult('Error during area selection')
    }
  });
});

document.getElementById('scan-btn').addEventListener('click', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: "selectionDiv"});
  });
});


document.body.appendChild(selectionDiv);
let isDrawing = false; // Allow users to draw a rectangle on the screen

const startDrawing = (e) => {
  isDrawing = true;
  startX = e.pageX;
  startY = e.pageY;
  selectionDiv.style.display = 'block';
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
  
const captureSelectedArea = async () => {
  const rect = selectionDiv.getBoundingClientRect();
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
    selectionDiv.style.display = 'none'; // Hide after capturing
  }).catch((error) => {
    console.error('Error capturing area:', error);
  });
};


document.addEventListener('mousedown', startDrawing, { once: true });
document.addEventListener('mouseup', stopDrawing, { once: true });
document.addEventListener('mousemove', onMouseMove);

    
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