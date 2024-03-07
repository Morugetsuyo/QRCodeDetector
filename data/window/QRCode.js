/* global instantiate, BarcodeDetector */

const TYPES = {
  8: 'EAN-8',
  9: 'UPC-E',
  10: 'ISBN-10',
  12: 'UPC-A',
  13: 'EAN-13',
  14: 'ISBN-13',
  25: 'Interleaved 2 of 5',
  39: 'Code 39',
  57: 'PDF417',
  64: 'QR Code',
  128: 'Code 128'
};

class TypePointer {
  constructor(ptr, buf) {
    this.ptr = ptr;
    this.ptr32 = ptr >> 2;
    this.buf = buf;
    this.HEAP8 = new Int8Array(buf);
    this.HEAPU32 = new Uint32Array(buf);
    this.HEAP32 = new Int32Array(buf);
  }
}
class SymbolPtr extends TypePointer {
  get type() {
    return this.HEAPU32[this.ptr32];
  }
  get data() {
    const len = this.HEAPU32[this.ptr32 + 4];
    const ptr = this.HEAPU32[this.ptr32 + 5];
    return Int8Array.from(this.HEAP8.subarray(ptr, ptr + len));
  }
  get points() {
    const len = this.HEAPU32[this.ptr32 + 7];
    const ptr = this.HEAPU32[this.ptr32 + 8];
    const ptr32 = ptr >> 2;
    const res = [];
    for (let i = 0; i < len; ++i) {
      const x = this.HEAP32[ptr32 + i * 2];
      const y = this.HEAP32[ptr32 + i * 2 + 1];
      res.push({x, y});
    }
    return res;
  }
  get next() {
    const ptr = this.HEAPU32[this.ptr32 + 11];
    if (!ptr) {
      return null;
    }
    return new SymbolPtr(ptr, this.buf);
  }
  get time() {
    return this.HEAPU32[this.ptr32 + 13];
  }
  get cacheCount() {
    return this.HEAP32[this.ptr32 + 14];
  }
  get quality() {
    return this.HEAP32[this.ptr32 + 15];
  }
}
class SymbolSetPtr extends TypePointer {
  get head() {
    const ptr = this.HEAPU32[this.ptr32 + 2];
    if (!ptr) {
      return null;
    }
    return new SymbolPtr(ptr, this.buf);
  }
}

class WasmQRCode {
  constructor(canvas) {
    canvas = canvas || document.createElement('canvas');
    Object.assign(this, {
      ctx: canvas.getContext('2d', {
        willReadFrequently: true
      }),
      canvas
    });
    this.events = {};
    this.isQRCodeDetected = false; // Initialize detection flag
  }
  ready() {
    if (this.inst) {
      return Promise.resolve();
    }
    return instantiate().then(o => {
      this.inst = o;
      this.ptr = o._ImageScanner_create();
    });
  }
  detect(source, width, height) {
    return new Promise((resolve, reject) => {
      if (this.isQRCodeDetected) {
        // Resolve immediately if a QR code has already been detected to prevent re-processing
        return resolve({message: 'QR Code already detected. Skipping detection.'});
      }
      const {canvas, ctx} = this;
      Object.assign(canvas, { width, height });
      ctx.drawImage(source, 0, 0, width, height);
      let imageData = ctx.getImageData(0, 0, width, height);

      // Apply contrast
      const contrast = 1.5; // adjust this value
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = factor * (imageData.data[i] - 128) + 128;
        imageData.data[i + 1] = factor * (imageData.data[i + 1] - 128) + 128;
        imageData.data[i + 2] = factor * (imageData.data[i + 2] - 128) + 128;
      }

      // Put image data back into context
      ctx.putImageData(imageData, 0 ,0);

      const dataBuf = ctx.getImageData(0, 0, width, height).data;
      // write to WASM
      const heap = this.inst.HEAPU8;
      const data = new Uint8Array(dataBuf);
      const len = width * height;
      if (len * 4 !== data.byteLength) {
        return reject(new Error('dataBuf does not match width and height'));
      }
      const buf = this.inst._malloc(len);
      for (let i = 0; i < len; ++i) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        heap[buf + i] = (r * 19595 + g * 38469 + b * 7472) >> 16;
      }
      const imagePtr = this.inst._Image_create(width, height, 0x30303859 /* Y800 */, buf, len, 1);
      // scan
      const count = this.inst._ImageScanner_scan(this.ptr, imagePtr);
      console.info('count', count);
      // read results
      const res = this.inst._Image_get_symbols(imagePtr);
      if (res !== 0) {
        this.isQRCodeDetected = true; // Set flag on successful detection
        const set = new SymbolSetPtr(res, this.inst.HEAPU8.buffer);
        const decoder = new TextDecoder();
        let symbol = set.head;
        let detections = [];
        
        while (symbol !== null) {
          detections.push({
            origin: 'wasm',
            symbol: TYPES[symbol.type],
            data: decoder.decode(symbol.data),
            polygon: symbol.points.map(o => [o.x, o.y]).flat()
          });
          symbol = symbol.next;
        }
        resolve(detections); // Resolve the promise with the detection results
      } else {
        // If no QR code is detected, resolve with an indication that no QR codes were found
        resolve({message: 'No QR Code detected.'});
      }
      // Always free the allocated memory to avoid memory leaks
      this.inst._Image_destory(imagePtr);
    });
  }

  resetDetection() {
    this.isQRCodeDetected = false;
    this.clean(this.canvas);
  }

  clean(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  
  rect(e) {
    const xs = [
      Math.min(...e.polygon.filter((a, i) => i % 2 === 0)),
      Math.max(...e.polygon.filter((a, i) => i % 2 === 0)) 
    ];
    const ys = [
      Math.min(...e.polygon.filter((a, i) => i % 2 === 1)), 
      Math.max(...e.polygon.filter((a, i) => i % 2 === 1))
    ];
    if (e.symbol.toUpperCase() === 'QR-CODE' || e.origin === 'native') {
      return [e.polygon[0], e.polygon[1], xs[1] - e.polygon[0], ys[1] - e.polygon[1]];
    }
    else {
      return [e.polygon[0], e.polygon[1], xs[0] - e.polygon[0], ys[1] - e.polygon[1]];
    }
  }
  draw(e, canvas = this.canvas) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = e.origin === 'native' ? 'red' : 'blue';
    ctx.globalAlpha = 0.2;
    const [x, y, w, h] = this.rect(e);
    ctx.fillRect(x - 10, y - 10, w + 20, h + 20);
  }
  clean(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  on(name, c) {
    this.events[name] = this.events[name] || [];
    this.events[name].push(c);
  }
  emit(name, ...args) {
    for (const c of (this.events[name] || [])) {
      c(...args);
    }
  }
}

class QRCode extends WasmQRCode {
  constructor(...args) {
    super(...args);

    if (typeof BarcodeDetector !== 'undefined') {
      BarcodeDetector.getSupportedFormats().then(supportedFormats => {
        if (supportedFormats.includes('qr_code')) {
          this.barcodeDetector = new BarcodeDetector({formats: ['qr_code']});
        }
      });
    }
  }

  detect(source, width, height) {
    return new Promise((resolve, reject) => {
      if (this.isQRCodeDetected) {
        return reject(new Error('QR Code already detected'));
      }
      // Set a timeout for QR code detection
      const timeoutId = setTimeout(() => {
        this.isQRCodeDetected = false; // Reset the detection flag
        reject(new Error('Detection timeout - No QR Code'));
      }, 5000);

      // Try native BarcodeDetector detection
      if (this.barcodeDetector) {
        this.barcodeDetector.detect(source).then(barcodes => {
          clearTimeout(timeoutId);
          if (barcodes.length > 0) {
            this.isQRCodeDetected = true; // Set the detection flag to true
            resolve(barcodes.map(barcode => ({
              origin: 'native',
              symbol: barcode.format,
              data: barcode.rawValue,
              points: barcode.cornerPoints
            })));
          } else {
            resolve([]); // Resolve with an empty array if no barcodes are found
          }
        }).catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
      } else {
        // Fallback to WASM-based detection
        super.detect(source, width, height).then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        }).catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
      }
    });
  } 
  // ... [other methods] ...
}

