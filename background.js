'use strict';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "initiateCaptureAndSelection":
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          console.error('Error capturing tab:', chrome.runtime.lastError.message);
          sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          // Assuming initiateAreaSelection sends its own response, no need to send one here
          if (sender.tab?.id) {
            initiateAreaSelection(sender.tab.id);
          }
        }
      });
      return true; // Indicates async response

    // Removed 'captureTab' case as it's no longer used

    case 'processLocalImage':
      console.log('Local image processed', request.dataUrl);
      sendResponse({ message: 'Local image processed' });
      return true;

    case 'captureDataUrl':
      console.log('Captured Data URL received', request.dataUrl);
      processImageForQRCode(request.dataUrl); // Continue processing the image as before
      return true;
  }
});

function initiateAreaSelection(tabId) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['contentScript.js']
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error injecting content script for area selection:', chrome.runtime.lastError.message);
      // Possibly handle the error or notify the user
    } else {
      console.log('Content script injected for area selection.');
      chrome.tabs.sendMessage(tabId, { action: 'activateSelectionMode' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message to content script:', chrome.runtime.lastError.message);
        } else {
          console.log('Area selection mode activated', response);
        }
      });
    }
  });
}
