chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrollPage') {
        // Scroll the page or perform other DOM manipulations here.
        window.scrollBy(0, window.innerHeight);
        sendResponse({status: 'Page scrolled'});
    }
});
