document.addEventListener('DOMContentLoaded', () => {
  const partsList = document.getElementById('partsList');
  const overlay = document.getElementById('overlay');
  const matrixImage = document.getElementById('matrixImage');
  const resetBtn = document.getElementById('resetBtn');
  const removeOneBtn = document.getElementById('removeOneBtn');
  const rowLabels = document.getElementById('rowLabels');

  const TOTAL_ROWS = 8; 

  const WIDTH_FRACTIONS = {
    "1.png": 1,
    "meio.png": 1 / 2,
    "terco.png": 1 / 3,
    "quarto.png": 1 / 4,
    "sexto.png": 1 / 6,
    "umoitavo.png": 1 / 8,
    "12.png": 1 / 12,
    "umdezeseisavo.png": 1 / 16
  };

  const ROW_BY_FRACTION = {
    "1.png": 0,
    "meio.png": 1,
    "terco.png": 2,
    "quarto.png": 3,
    "sexto.png": 4,
    "umoitavo.png": 5,
    "12.png": 6,
    "umdezeseisavo.png": 7
  };

  // Calcula os offsets reais da imagem da matriz em relação ao overlay
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

  // Calcula o tamanho da peça com base na fração e no número de linhas
  function calcSize(imgSrc) {
    const offs = getMatrixOffsets();
    const rowHeight = offs.height / TOTAL_ROWS;
    const key = imgSrc.split("/").pop();

    return {
      width: offs.width * WIDTH_FRACTIONS[key],
      height: rowHeight
    };
  }

  // Cria uma peça já posicionada na linha correta da sua fração
  function createPlacedPiece(imgEl) {
    const key = imgEl.src.split("/").pop();
    const rowIndex = ROW_BY_FRACTION[key] ?? 0;

    const clone = document.createElement('img');
    clone.src = imgEl.src;
    clone.className = 'placed';
    clone.draggable = false;
    clone.dataset.fraction = key;
    clone.dataset.row = rowIndex;

    const size = calcSize(imgEl.src);
    const offs = getMatrixOffsets();

    clone.style.width = size.width + "px";
    clone.style.height = size.height + "px";

    // Posiciona na linha correta, começando da esquerda
    clone.style.left = (offs.left) + 'px';
    clone.style.top = (offs.top + rowIndex * (offs.height / TOTAL_ROWS)) + 'px';

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
      el.classList.add('dragging');

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
      el.classList.remove('dragging');
      try { el.releasePointerCapture(e.pointerId); } catch (_) {}
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    }

    el.addEventListener('pointerdown', onPointerDown);
  }

  // Corrige o padding do overlay em relação ao container
  function syncOverlayToImage() {
    const matrixRect = matrixImage.getBoundingClientRect();
    const containerRect = overlay.parentElement.getBoundingClientRect();

    overlay.style.left = (matrixRect.left - containerRect.left) + 'px';
    overlay.style.top = (matrixRect.top - containerRect.top) + 'px';
    overlay.style.width = matrixRect.width + 'px';
    overlay.style.height = matrixRect.height + 'px';
  }

  // Cria a peça na linha correta e reposiciona se a janela mudar de tamanho
  partsList.addEventListener('pointerdown', (ev) => {
    const target = ev.target;
    if (target && target.classList.contains('piece')) {
      syncOverlayToImage();
      createPlacedPiece(target);
    }
  });

  resetBtn.addEventListener('click', () => {
    overlay.querySelectorAll('.placed').forEach(el => el.remove());
  });

  removeOneBtn.addEventListener('click', () => {
    const pieces = overlay.querySelectorAll('.placed');
    if (pieces.length > 0) {
      pieces[pieces.length - 1].remove();
    }
  });

  function createRowLabels(){
    rowLabels.innerHTML = '';
    for(let i = 0; i < TOTAL_ROWS; i++){
      const label = document.createElement('span');
      label.textContent = 'F' + (i + 1);
      rowLabels.appendChild(label);
    }
  }

  // Reposiciona as peças quando a janela é redimensionada
  window.addEventListener('resize', () => {
    syncOverlayToImage();
    overlay.querySelectorAll('.placed').forEach(el => {
      const key = el.dataset.fraction;
      const row = parseInt(el.dataset.row, 10);
      const size = calcSize(key);
      const offs = getMatrixOffsets();
      el.style.width = size.width + 'px';
      el.style.height = size.height + 'px';
      el.style.top = (offs.top + row * (offs.height / TOTAL_ROWS)) + 'px';
      // mantém left, mas reajusta se saiu dos limites
      const left = parseFloat(el.style.left) || offs.left;
      const clampedLeft = Math.max(offs.left, Math.min(offs.left + offs.width - size.width, left));
      el.style.left = clampedLeft + 'px';
    });
  });

  createRowLabels();
  syncOverlayToImage();
});
