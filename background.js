/*
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
*/

'use strict';

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "injectScript") {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length > 0) {
        // Inject html2canvas.min.js first
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          files: ['data/window/src/html2canvas.min.js']
        }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error injecting html2canvas: ", chrome.runtime.lastError.message);
            return;
          }
          // After injecting html2canvas, inject content.js
          chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            files: ['data/window/contentScript.js']
          }, () => {
            if (chrome.runtime.lastError) {
              console.error("Error injecting content.js: ", chrome.runtime.lastError.message);
            } else {
              // After successfully injecting content.js, send a message to initiate capture
              chrome.tabs.sendMessage(tabs[0].id, {action: "initiatecapture"}, response => {
                if(chrome.runtime.lastError) {
                  console.error("Error initiating capture: ", chrome.runtime.lastError.message);
                } else {
                  console.log("Capture initiated: ", response);
                }
              });
            }
          });
        });
      }
    });
    return true;
  } 
});
