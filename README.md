# QRCodeDetector_TEST
Pilot Version 1.3.5

TCS_QR(ZBar_dev) - Win
│
├── background.js
├── manifest.json
├── popup.png
├── readme.md
└── data
    │
    ├── icons.png
    └── window
        │
        ├── index.html
        ├── index_backup.js
        ├── index.js
        ├── QRCode_backup.js
        ├── QRCode.js
        └── ZBar
            ├── README.md
            ├── zbar.js
            └── zbar.wasm


Issues:
1. Shows different decoding abilities based on the working platform (MacOS >>> Windows)

Objectives:
1. Optimizing WebAssembly Module Loading (lazy loading & caching wasm module)
2. Using Web Workers for Image Processing
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