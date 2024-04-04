# QRCodeDetector_PILOT
Pilot Version 

TCS_QR(ZBar_dev) - Win
├── icons
│   └── icons.png 
├── js
│   ├── background.js
│   ├── jquery-3.7.1.min.js
│   ├── snipping.js
│   ├── zbar.js
│   └── zbar.wasm
├── popup
│   ├── index.html
│   ├── index.js
│   ├── QRCode.js
│   ├── style.css
│   └── web_worker.js
├── .gitignore
├── manifest.json
└── README.md

Updates(Builder):
1.0.2: Fixed bugs on 'reset' logic
1.1.0: Fixed bugs on 'display-area' and improve popup UI
1.1.4: Fixed bugs on decoding logic
1.1.7: Tested different zbar.js library
1.1.9: Fixed asynchronous errors
1.2.1: Added scaleFactor, sharpening, and grayscale on the processImageForQRCode
1.3.1: Add functions to preprocess images (new Grayscaling, adjusting contrast, edge detection logic)
1.3.3: Minor Adjustments (Deprecated 'MarvinColorModelConverter' library)
1.3.5: Implemented lazy loading 
1.5.1: Implemented Web Worker for image preprocessing (indes.js -> web_worker.js)
2.0.1: Implemented content script and functions for caturing specific tab area.
2.1.1: test ver. (communication check between index.js and contentScript.js)
2.2.1: Optimization 
2.5.1: Fix link chrome.tab.sendMessage & chrome.tab.onMessage flow
3.0.1: Implemented tab capturing code using html2canvas (jCrop plugin)
--------------------------------------------------------------------------------------------------------
1.0.0: Pilot Program



