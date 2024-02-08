# QRCodeDetector
Pilot Version 1.1.0 

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

Objectives:
1. Process image and highlight the detected area
2. Enhance the detection abilities. (add zxing package or modify the decoding logic)
3. Field Test
4. Testify the effectiveness of this program

Updates:
1.0.2: Fix bugs on 'reset' logic
1.1.0: Fix bugs on 'display-area' and improve popup UI