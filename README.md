# QRCodeDetector_TEST
Pilot Version 

TCS_QR(ZBar_dev) - Win
├── icons
│   └── icons.png (deprecated)
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
├── image_display.html
├── manifest.json
└── README.md



Issues:
1. Shows different decoding abilities based on the working platform (MacOS >>> Windows)

Objectives:
1. Optimizing WebAssembly Module Loading (lazy loading & caching wasm module)
2. Using Web Workers for Image processing (QRCode.js)
3. Consider implementing Polyfill & distortion correction libraries. (https://jywarren.github.io/fisheyegl/example/#a=0.942&b=0.865&Fx=0.42&Fy=0.34&scale=0.527&x=0.266&y=0.489)
4. Enhance sharpening the edges (e.g. sobel edge detection algorithm)
5. Process image and highlight the detected area (Add polygon)

Updates:
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
3.0.1: Implemented tab capturing code using html2canvas

https://www.goodreads.com/book/show/4865.How_to_Win_Friends_and_Influence_People


jCrop plugin
