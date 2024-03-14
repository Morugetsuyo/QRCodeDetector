'use strict';

chrome.runtime.onMessage.addEventListener(function(request, _sender, _sendResponse) {
  if(request.action === "selectionDiv") {
    if (selectionDiv.style.display === 'block') {
      selectionDiv.style.display = 'none';
    } else {
      selectionDiv.style.display = 'block';
    }
    _sendResponse({status: "success"});
  }
});

let selectionDiv = document.createElement('div');
document.body.appendChild(selectionDiv);
Object.assign(selectionDiv.style, {
  position: 'absolute',
  zIndex: '2147483647', // Ensure it's on top
  border: '1px soild #5eeb57',
  display: 'none'
});

let startX, startY, isSelecting = false;
let selectionModeActive = false;

function activateSelectionMode() {
  selectionModeActive = true;
}

function deactivateSelectionMode() {
  selectionModeActive = false;
}

document.addEventListener('mousedown', function (e) {
  if (!selectionModeActive) return;
  // Initialize the selection rectangle's position and size
  startX = e.pageX;
  startY = e.pageY;
  Object.assign(selectionDiv.style, {
    left: startX + 'px',
    top: startY + 'px',
    width: '0px',
    height: '0px',
    display: 'block'
  });
  isSelecting = true;
});

document.addEventListener('mousemove', function (e) {
  if (!selectionModeActive || !isSelecting) return;
  // Update the selection rectangle's size as the mouse moves
  let currentX = e.pageX;
  let currentY = e.pageY;
  let width = Math.abs(currentX - startX);
  let height = Math.abs(currentY - startY);
  Object.assign(selectionDiv.style, {
    left: Math.min(currentX, startX) + 'px',
    top: Math.min(currentY, startY) + 'px',
    width: width + 'px',
    height: height + 'px'
  });
});

document.addEventListener('mouseup', function () {
  if (!selectionModeActive || !isSelecting) return;
  isSelecting = false;
  selectionDiv.style.display = 'none'; // Hide the selection rectangle

  if (parseInt(selectionDiv.style.width, 10) > 0 && parseInt(selectionDiv.style.height, 10) > 0) {
    chrome.runtime.sendMessage({
      action: 'areaSelected',
      coords: {
        x: parseInt(selectionDiv.style.left, 10),
        y: parseInt(selectionDiv.style.top, 10),
        width: parseInt(selectionDiv.style.width, 10),
        height: parseInt(selectionDiv.style.height, 10)
      }
    });
  }

  deactivateSelectionMode();

  // Reset the selectionDiv for the next use
  Object.assign(selectionDiv.style, {
    width: '0px',
    height: '0px',
    display: 'none'
  });
});
