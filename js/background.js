/*
'use strict';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureTab") {
    chrome.tabs.captureVisibleTab(null, {format: 'png', quality: 100}, (imageUri) => {
      if (chrome.runtime.lastError) {
        console.error('Error capturing the tab: ', chrome.runtime.lastError.message);
        sendResponse({success: false, error: "Failed to capture tab"});
      } else {
        chrome.windows.create({url: `image_display.html#${encodeURIComponent(imageUri)}`, type: "popup"});
        sendResponse({success: true});
      }
    });
    return true; // Indicates an asynchronous response.
  } else if (request.action === "imageSelectedForQR") {
    // The key change is here: this action sends the selected image area directly to the content script.
    // The sendMessage target should be adapted to your extension's specific requirements.
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {action: "processSelectedImage", dataUrl: request.dataUrl});
    });
    sendResponse({success: true, message: 'Selected area sent for QR processing'});
    return true; // Indicates an asynchronous response.
  }
});
*/

'use strict';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureTab") {
    chrome.tabs.captureVisibleTab(null, {format: 'png', quality: 100}, (imageUri) => {
      if (chrome.runtime.lastError) {
        console.error('Error capturing the tab: ', chrome.runtime.lastError.message);
        sendResponse({success: false, error: "Failed to capture tab"});
      } else {
        // Ensure the window creation is properly managed and points to the correct HTML file
        chrome.windows.create({url: `image_display.html#${encodeURIComponent(imageUri)}`, type: "popup"}, (newWindow) => {
          // This callback can be utilized for further actions if needed
        });
        sendResponse({success: true});
      }
    });
    return true; // Indicates an asynchronous response.
  } else if (request.action === "imageSelectedForQR") {
    // This portion should properly target the tab where the QR code detection will occur
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {action: "processSelectedImage", dataUrl: request.dataUrl});
    });
    sendResponse({success: true, message: 'Selected area sent for QR processing'});
    return true; // Indicates an asynchronous response.
  }
});
