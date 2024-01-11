'use strict';

// Function to capture the current active tab
const captureActiveTab = () => {
  chrome.tabs.captureVisibleTab(null, { format: 'png' }, dataUrl => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
    } else {
      // Send the data URL to the popup script or handle it as needed
      console.log('Captured tab image.');
    }
  });
};

// Listen for a message from the popup script to capture the active tab
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureTab') {
    captureActiveTab();
    sendResponse({ message: 'Tab captured' });
  }
  // Check for other messages or actions as needed
});

// Listen for when the user clicks on the extension icon
chrome.action.onClicked.addListener(tab => {
  // Here you can define what should happen when your extension's icon is clicked
  captureActiveTab();
});

// Add other listeners as needed, for example, to handle file uploads from the popup
