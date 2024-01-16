'use strict';

// Function to capture the current active tab
const captureActiveTab = () => {
  chrome.tabs.captureVisibleTab(null, { format: 'png' }, dataUrl => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
    } else {
      // Send the data URL to the popup script
      chrome.runtime.sendMessage({ action: 'capturedImage', dataUrl: dataUrl });
      console.log('Captured tab image.');
    }
  });
};


// Listen for messages fom the popup script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureTab') {
    capturedActiveTab();
    sendResponse({ message: 'Tab captured' });
  }
  else if (request.action === 'processLocalImage') {
    // Assuming the image data URL is sent in the request
    const dataUrl = request.dataUrl;
    // Send the data URL to the popup script for processing
    chrome.runtime.sendMessage({ action: 'localImage', dataUrl: dataUrl });
    sendResponse({ message: 'Local image processed' });
  }
});

// Listen for when the user clicks on the extension icon
chrome.action.onClicked.addListener(tab => {
  // This can be used to open the popup or perform other actions
  captureActiveTab();
});