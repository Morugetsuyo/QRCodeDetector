# QRCodeDetector
Completed Version 1.0.0 
File composition:
1. manifest.json
2. background.js: extension service worker
3. index.html: popup window
4. index.js: capture active tab, loading image from the local, set image format
5. QRCode.js: Decoding logic using zbar.js & zbar.wasm
6. zbar.js: JavaScript version of ZBar package
7. zbar.wasm: ZBar web assembly file

Issues:
1. Captured image breaks the displaying area boundary.
2. User can't see the detection field.
3. Detection ability fall behind the expectation.
4. No time limit for decoding process. 
5. Problems when there are multiple QR Codes in an image

Objectives:
1. Process image and highlight the detected area
2. If there's highlighted area(== QR Code is detected), display highlighted inside the '
3. Add function to capture the image inside the 'image-display-area'
4. Enhance the detection abilities 