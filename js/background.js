'use strict';

// background.js
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.captureVisibleTab(null, { format: 'png', quality: 100 }, (imageUri) => {
        if (chrome.runtime.lastError) {
            console.error('Error capturing the tab:', chrome.runtime.lastError.message);
        } else {
            chrome.windows.create({url: `../popup/index.html#${encodeURIComponent(imageUri)}`,type: "popup"}, () => {});
        }
    });
});
