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
class Symbol {
  constructor(ptr) {
      this.type = ptr.type;
      this.typeName = enum_1.ZBarSymbolType[this.type];
      this.data = ptr.data;
      this.points = ptr.points;
      this.time = ptr.time;
      this.cacheCount = ptr.cacheCount;
      this.quality = ptr.quality;
  }
  static createSymbolsFromPtr(ptr, buf) {
      if (ptr == 0)
          return [];
      const set = new SymbolSetPtr(ptr, buf);
      let symbol = set.head;
      const res = [];
      while (symbol !== null) {
          res.push(new Symbol(symbol));
          symbol = symbol.next;
      }
      return res;
  }
  decode(encoding) {
      const decoder = new TextDecoder(encoding);
      return decoder.decode(this.data);
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
    this.inst = null; // Initialize Wasm instance as null
    this.loadingPromise = null; // To track the loading state of the Wasm module
  }

  ready() {
    if (this.inst) {
      return Promise.resolve();
    }
    if (!this.loadingPromise) {
      this.loadingPromise = instantiate().then(o => {
        this.inst = o;
        this.ptr = o._ImageScanner_create();
        return o;
      });
    }
    return this.loadingPromise;
  }

  async detect(source, width, height) {
    await this.ready(); // Ensure Wasm module is loaded before detection
    
    return new Promise((resolve, reject) => {
      if (this.isQRCodeDetected) {
        // Resolve immediately if a QR code has already been detected to prevent re-processing
        return resolve({message: 'QR Code already detected. Skipping detection.'});
      }
      const {canvas, ctx} = this;
      Object.assign(canvas, { width, height });
      ctx.drawImage(source, 0, 0, width, height);
      let imageData = ctx.getImageData(0, 0, width, height);

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
            points: symbol.points.map(o => [o.x, o.y]).flat()
          });
          symbol = symbol.next;
        }
        resolve(detections); // Resolve the promise with the detection results
      } else {
        // If no QR code is detected, resolve with an indication that no QR codes were found
        resolve({message: 'No QR Code detected.'});
      }
      // Always free the allocated memory to avoid memory leaks
      this.inst._free(buf);
      this.inst._Image_destroy(imagePtr); // Corrected typo: _Image_destory to _Image_destroy
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

    // Initialize a flag indicating if the QR code detection has already attempted.
    this.isQRCodeDetected = false;

    if (typeof BarcodeDetector !== 'undefined') {
      BarcodeDetector.getSupportedFormats().then(supportedFormats => {
        if (supportedFormats.includes('qr_code')) {
          this.barcodeDetector = new BarcodeDetector({formats: ['qr_code']});
        }
      });
    }
  }

  async detect(source, width, height) {
    return new Promise(async (resolve, reject) => {
      if (this.isQRCodeDetected) {
        return reject(new Error('QR Code already detected'));
      }
      let detectionCompleted = false; // Flag to indicate if detection is completed

      // Set a timeout for QR code detection
      const timeoutId = setTimeout(() => {
        if (!detectionCompleted) {
          this.isQRCodeDetected = false; // Reset the detection flag
          reject(new Error('QR Code detection timeout - No QR code detected'));
        }
      }, 5000);

      // Try native BarcodeDetector detection first
      if (this.barcodeDetector) {
        try {
          const barcodes = await this.barcodeDetector.detect(source);;
          clearTimeout(timeoutId); // Clear the timeout
          if (barcodes.length > 0) {
            detectionCompleted = true; // Set the detection flag
            this.isQRCodeDetected = true; // Set the detection flag
            resolve(barcodes.map(barcode => ({
              origin: 'native',
              symbol: barcode.format,
              data: barcode.rawValue,
              polygon: barcode.cornerPoints
            })));
          } else {
            resolve([]);
          }
        } catch (error) {
          clearTimeout(timeoutId); // Clear the timeout
          reject(error);
        }
      } else {
        // Fallback to WASM-based detection
        try {
          const results = await super.detect(source, width, height);
          clearTimeout(timeoutId); // Clear the timeout
          detectionCompleted = true; // Set the detection flag
          resolve(results);
        } catch (error) {
          clearTimeout(timeoutId); // Clear the timeout
          reject(error);
        }
      }
    });
  }
}