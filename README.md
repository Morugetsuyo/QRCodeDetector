# QRCodeDetector_TEST
Pilot Version 1.2.1

TCS_QR(ZBar_dev)
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
        ├── index.js
        ├── QRCode.js
        └── ZBar
            ├── README.md
            ├── zbar.js
            └── zbar.wasm


Issues:
1. User can't see the detected field.
2. Problems when there are multiple QR Codes in an image.
3. Shows different decoding abilities based on the working platform (MacOS vs Windows)

Objectives:
1. Process image and highlight the detected area
2. Enhance the detection abilities. (Add multiple decoding packages, or using convolution filter on the 'processImageForQRCode')
3. Field Test
4. Testify the effectiveness of this program

Updates:
1.0.2: Fixed bugs on 'reset' logic
1.1.0: Fixed bugs on 'display-area' and improve popup UI
1.1.4: Fixed bugs on decoding logic
1.1.7: Tested different zbar.js library
1.1.9: Fixed asynchronous errors
1.2.1: Added scaleFactor, sharpening, and grayscale on the processImageForQRCode