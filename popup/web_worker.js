self.onmessage = async function(event) {
    const { action, imageData } = event.data;
    
    if (action === 'processImage') {
        createImageBitmap(new Blob([imageData]))
            .then(imageBitmap => {
                const offscreenCanvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
                const ctx = offscreenCanvas.getContext('2d');
                ctx.drawImage(imageBitmap, 0, 0);
                let imageData = ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height);
          
                // Apply image processing steps
                imageData = convertToGrayscale(imageData);
                imageData = applySharpen(imageData);
                imageData = adjustContrast(imageData);
                imageData = applyEdgeDetection(imageData);
                
                ctx.putImageData(imageData, 0, 0);
                offscreenCanvas.convertToBlob().then(blob => {
                    const processedDataUrl = URL.createObjectURL(blob);
                    self.postMessage({ action: 'imageProcessed', processedDataUrl });
                });
            })
            .catch(error => {
                console.error('Image processing failed:', error);
            });
    }  
};
  
function convertToGrayscale(imageData) {
  for (let i = 0; i < imageData.data.length; i +=4) {
    const gray = imageData.data[i] * 0.299 + imageData.data[i + 1] * 0.587 + imageData.data[i + 2] * 0.114;
    imageData.data[i] = imageData.data[i + 1] = imageData.data[i + 2] = gray;
  }
  return imageData;
}
  
function applySharpen(imageData) {
  const width = imageData.width;
  const height = imageData.height;
  const result = new ImageData(width, height);
  
  // A simplified approach to increase pixel contrast with its neighbors
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      // Simple sharpening: increase the contrast of the current pixel with its surrounding pixels
      result.data[i] = Math.min(255, Math.max(0, 1.5 * imageData.data[i] - 0.5 * (imageData.data[i - 4] + imageData.data[i + 4])));
      result.data[i + 1] = Math.min(255, Math.max(0, 1.5 * imageData.data[i + 1] - 0.5 * (imageData.data[i - 3] + imageData.data[i + 5])));
      result.data[i + 2] = Math.min(255, Math.max(0, 1.5 * imageData.data[i + 2] - 0.5 * (imageData.data[i - 2] + imageData.data[i + 6])));
      result.data[i + 3] = imageData.data[i + 3]; // Copy alpha channel
    }
  }
  return result;
}
  
function adjustContrast(imageData, contrast = 1.5) {
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] = factor * (imageData.data[i] - 128) + 128; // R
    imageData.data[i + 1] = factor * (imageData.data[i + 1] - 128) + 128; // G
    imageData.data[i + 2] = factor * (imageData.data[i + 2] - 128) + 128; // B
  }
  return imageData;
}
  
function applyEdgeDetection(imageData) {
  const width = imageData.width;
  const height = imageData.height; 
  const sobelKernelX = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];
  const sobelKernelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];
  
  function getPixelIntensity(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return 0;
    const index = (y * width + x) * 4;
    const r = imageData.data[index];
    const g = imageData.data[index + 1];
    const b = imageData.data[index + 2];
    // Convert to grayscale intensity
    return r * 0.3 + g * 0.59 + b * 0.11;
  }
  
  const result = new ImageData(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let gx = 0, gy = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const intensity = getPixelIntensity(x + dx, y + dy);
          gx += intensity * sobelKernelX[dy + 1][dx + 1];
          gy += intensity * sobelKernelY[dy + 1][dx + 1];
        }
      }
      const magnitude = Math.sqrt(gx * gx + gy * gy) >>> 0;
      const index = (y * width + x) * 4;
      result.data[index] = result.data[index + 1] = result.data[index + 2] = magnitude;
      result.data[index + 3] = 255; // Opaque alpha channel
    }
  }
  return imageData; 
}
  