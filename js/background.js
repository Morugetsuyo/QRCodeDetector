'use strict';

// Listen for messages from content scripts or the extension's pages
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "injectScript") {
    // Injects the required scripts into the current active tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length > 0) {
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          files: ['data/window/src/html2canvas.min.js']
        }, function() {
          if (chrome.runtime.lastError) {
            console.error("Error injecting html2canvas: ", chrome.runtime.lastError.message);
            return;
          }
          // After injecting html2canvas, proceed to inject capture.js
          chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            files: ['data/window/capture.js']
          }, function() {
            if (chrome.runtime.lastError) {
              console.error("Error injecting capture.js: ", chrome.runtime.lastError.message);
            } else {
              // Initiate the capture process by sending a message to the content script
              chrome.tabs.sendMessage(tabs[0].id, {action: "initiatecapture"}, function(response) {
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
    return true; // Indicates an asynchronous response
  }
});
