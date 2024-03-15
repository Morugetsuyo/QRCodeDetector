'use strict';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "captureTab":
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          console.error('Error capturing tab:', chrome.runtime.lastError.message);
          sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ imageSrc: dataUrl });
        }
      });
      return true; // Indicates async response for sendResponse

    case 'initiateAreaSelection':
      if (sender.tab?.id) {
        initiateAreaSelection(sender.tab.id, sendResponse);
      } else {
        sendResponse({error: 'No active tab ID found for area selection.'});
      }
      return true; // Indicates async response for sendResponse

    case 'processLocalImage':
      console.log('Local image processed', request.dataUrl);
      sendResponse({ message: 'Local image processed' });
      return true;

    case 'areaSelectionCompleted':
      setUserHasCompletedSelection(true);
      console.log('Area selection reported as completed.');
      return true;

    case 'checkSelectionStatus':
      checkUserSelectionStatus(true);
      console.log('checking selection status. This functionality needs to be fully implemented.');
      return true; 
  }
});

function initiateAreaSelection(tabId, sendResponse) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['contentScript.js']
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error injecting content script for area selection:', chrome.runtime.lastError.message);
      sendResponse({ error: chrome.runtime.lastError.message });
    } else {
      console.log('Content script injected for area selection.');
      sendResponse({ success: true });
    }
  });
  return true;
}

function setUserHasCompletedSelection(completed) {
  chrome.storage.local.set({ 'selectionCompleted': completed }, (error) => {
    if (error) {
      console.error(`Error setting selectionCompleted: ${error}`);
    } else {
      console.log('Selection completion status updated successfully.');
    }
  });
}

function checkUserSelectionStatus(sendResponse) {
  chrome.storage.local.get('selectionCompleted', (result) => {
    if (chrome.runtime.lastError) {
      console.error(`Error retrieving selectionCompleted: ${chrome.runtime.lastError}`);
      sendResponse({ selectionCompleted: false});
    } else {
      sendResponse({ selectionCompleted: result.selectionCompleted === true });
    }
  });
}
