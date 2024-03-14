'use strict';

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "captureTab") {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error('Error capturing tab', chrome.runtime.lastError.message);
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ imageSrc: dataUrl });
        console.log('Captured tab image.');
      }
    });
    return true;  // Indicate asynchronous response
  }
  else if (request.action === 'processLocalImage') {
    const dataUrl = request.dataUrl;
    console.log('Local image processed', dataUrl);
    sendResponse({ message: 'Local image processed' });
    return true;
  }
  else if (request.action === 'scrollPage') {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: scrollToBottom
      }).then(() => {
        sendResponse({message: 'Page scrolled'});
      }).catch((error) => {
        console.error('Error scrolling page:', error);
        sendResponse({error: error.toString()});
      });
    });
    return true;
  }
});

// Function to scroll to the bottom of the page
function scrollToBottom() {
  window.scrollTo(0, document.body.scrollHeight);
}