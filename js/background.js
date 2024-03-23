'use strict';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureTab") {
      chrome.tabs.captureVisibleTab(null, {format: 'png', quality: 100}, (imageUri) => {
          if (chrome.runtime.lastError) {
              console.error('Error capturing the tab: ', chrome.runtime.lastError.message);
              sendResponse({success: false, error: "Failed to capture tab"});
          } else {
              chrome.windows.create({url: `image_display.html#${encodeURIComponent(imageUri)}`});
              sendResponse({success: true});
          }
      });
      return true; // Indicate async response
  } else if (request.action === "imageSelectedForQR") {
      // TODO: Handle the QR code processing of the selected area here
      console.log('QR processing to be implemented for: ', request.dataUrl);

      // Placeholder response until QR processing is implemented
      sendResponse({success: true, message: 'QR processing to be implemented'});

      // After processing, you might need to communicate back to the content script or popup
      return true; // If QR processing is async, return true
  }
});
