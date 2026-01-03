document.addEventListener('DOMContentLoaded', () => {
  const partsList = document.getElementById('partsList');
  const overlay = document.getElementById('overlay');
  const matrixImage = document.getElementById('matrixImage');
  const resetBtn = document.getElementById('resetBtn');

  const WIDTH_FRACTIONS = {
    "1.png": 1,
    "meio.png": 1 / 2,
    "terco.png": 1 / 3,
    "quarto.png": 1 / 4,
    "sexto.png": 1 / 6,
    "12.png": 1 / 12
  };

  function getMatrixOffsets() {
    const matrixRect = matrixImage.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();

    return {
      top: matrixRect.top - overlayRect.top,
      left: matrixRect.left - overlayRect.left,
      width: matrixRect.width,
      height: matrixRect.height
    };
  }

  function calcSize(imgSrc) {
    const offs = getMatrixOffsets();
    const rowHeight = offs.height / 6;
    const key = imgSrc.split("/").pop();

    return {
      width: offs.width * WIDTH_FRACTIONS[key],
      height: rowHeight
    };
  }

  function createPlacedPiece(imgEl, left = 0, top = 0) {
    const clone = document.createElement('img');
    clone.src = imgEl.src;
    clone.className = 'placed';
    clone.draggable = false;

    const size = calcSize(imgEl.src);
    const offs = getMatrixOffsets();

    clone.style.width = size.width + "px";
    clone.style.height = size.height + "px";

    clone.style.left = (offs.left + left) + 'px';
    clone.style.top = (offs.top + top) + 'px';

    overlay.appendChild(clone);
    makeDraggable(clone);
  }

  function makeDraggable(el) {
    let startX = 0, startY = 0;
    let origLeft = 0, origTop = 0;
    let dragging = false;

    function bounds() {
      const offs = getMatrixOffsets();

      return {
        left: offs.left,
        right: offs.left + offs.width - el.offsetWidth,
        top: offs.top,
        bottom: offs.top + offs.height - el.offsetHeight
      };
    }

    function onPointerDown(e) {
      e.preventDefault();
      dragging = true;
      el.setPointerCapture(e.pointerId);

      startX = e.clientX;
      startY = e.clientY;
      origLeft = parseFloat(el.style.left) || 0;
      origTop = parseFloat(el.style.top) || 0;

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    }

    function onPointerMove(e) {
      if (!dragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newLeft = origLeft + dx;
      let newTop = origTop + dy;

      const b = bounds();

      newLeft = Math.max(b.left, Math.min(b.right, newLeft));
      newTop = Math.max(b.top, Math.min(b.bottom, newTop));

      el.style.left = newLeft + 'px';
      el.style.top = newTop + 'px';
    }

    function onPointerUp(e) {
      dragging = false;
      try { el.releasePointerCapture(e.pointerId); } catch (_) { }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    }

    el.addEventListener('pointerdown', onPointerDown);
  }

  partsList.addEventListener('pointerdown', (ev) => {
    const target = ev.target;
    if (target && target.classList.contains('piece')) {
      const count = overlay.querySelectorAll('.placed').length;
      createPlacedPiece(target, 10, count * 10);
    }
  });
  resetBtn.addEventListener('click', () => {
    overlay.querySelectorAll('.placed').forEach(el => el.remove());
  });
});