'use strict';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureTab") {
    chrome.tabs.captureVisibleTab(null, {format: 'png', quality: 100}, (imageUri) => {
      if (chrome.runtime.lastError) {
        console.error('Error capturing the tab: ', chrome.runtime.lastError.message);
        sendResponse({success: false, error: "Failed to capture tab"});
      } else {
        chrome.windows.create({url: `image_display.html#${encodeURIComponent(imageUri)}`, type: "popup"}, () => {});
        sendResponse({success: true, imageUri: imageUri});
      }
    });
    return true; // Indicates an asynchronous response.
  } else if (request.action === "imageSelectedForQR") {
    // Store the selected image data for later processing by the popup
    chrome.storage.local.set({selectedImageData: request.dataUrl}, () => {
      console.log("Selected image data stored.");
      sendResponse({success: true, message: 'Selected area stored for processing'});
      });
      return true; // Indicates an asynchronous response.
  }
});
