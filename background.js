'use strict';

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "captureTab") {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ imageSrc: dataUrl });
        console.log('Captured tab image.');
      }
    });
    return true;  // Indicate asynchronous response
  }
  else if (request.action === 'processLocalImage') {
    // Assuming the image data URL is sent in the request
    const dataUrl = request.dataUrl;
    // Process the local image here or send it for further processing
    console.log('Local image processed', dataUrl);
    sendResponse({ message: 'Local image processed' });
    return true;
  }
});
