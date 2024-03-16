'use strict';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "captureTab":
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          console.error('Error capturing tab:', chrome.runtime.lastError.message);
          sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          // process or store the captured image here
          sendResponse({ imageSrc: dataUrl });
          if (sender.tab?.id) {
            // initiateAreaSelection(sender.tab.id);
            initiateAreaSelection(sender.tab.id, sendResponse);
          }
        }
      });
      return true; // Indicates async response for sendResponse

    case 'processLocalImage':
      console.log('Local image processed', request.dataUrl);
      sendResponse({ message: 'Local image processed' });
      return true;

    case 'captureDataUrl':
      console.log('Captured Data URL received', request.dataUrl);
      sendResponse({ imageSrc: request.dataUrl});
      return true;
  }
});

// function initiateAreaSelection(tabId, sendResponse) {
function initiateAreaSelection(tabId, sendResponse) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['contentScript.js']
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error injecting content script for area selection:', chrome.runtime.lastError.message);
      sendResponse({ success: false, error: chrome.runtime.lastError.message });
    } else {
      console.log('Content script injected for area selection.');
      chrome.tabs.sendMessage(tabId, { action: 'activateSelectionMode' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message to content script:', chrome.runtime.lastError.message);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log('Area selection mode activated', response);
          sendResponse({ success: true });
        }
      });
    }
  });
  return true; // Indicates async response for sendResponse
}


