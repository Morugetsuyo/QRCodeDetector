chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "captureTab") {
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
        sendResponse({ imageSrc: dataUrl });
      });
      return true;  // to handle the response asynchronously
    }
  });
  
ß