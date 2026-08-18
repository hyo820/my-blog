(function () {
  var GRID_SIZE = 16;
  var CELL_COUNT = GRID_SIZE * GRID_SIZE; // 256
  var SCALE = 16; // export resolution: 1 cell = 16 real px
  var EXPORT_SIZE = GRID_SIZE * SCALE; // 256px canvas (width/height)
  var DEFAULT_COLOR = '#000000';
  var TRANSPARENT_CLASS = 'transparent'; // visual "transparent selected" indicator class

  var paletteEl = document.getElementById('palette');
  var customColorEl = document.getElementById('custom-color');
  var currentColorPreviewEl = document.getElementById('current-color-preview');
  var eraserBtn = document.getElementById('eraser-btn');
  var clearBtn = document.getElementById('clear-btn');
  var saveBtn = document.getElementById('save-btn');
  var pixelGridEl = document.getElementById('pixel-grid');
  var exportCanvas = document.getElementById('export-canvas');

  if (!paletteEl || !pixelGridEl || !exportCanvas) return;

  // pixels[row * 16 + col] = CSS color string | null (unpainted/transparent)
  var pixels = new Array(CELL_COUNT).fill(null);
  var currentColor = DEFAULT_COLOR;
  var isDrawing = false;

  // ---- selection helpers ----

  function clearSelectionHighlights() {
    var selected = document.querySelectorAll('.palette-swatch.selected, #custom-color.selected');
    for (var i = 0; i < selected.length; i++) {
      selected[i].classList.remove('selected');
    }
  }

  function updateCurrentColorPreview() {
    if (!currentColorPreviewEl) return;
    if (currentColor === null) {
      currentColorPreviewEl.style.backgroundColor = '';
      currentColorPreviewEl.classList.add(TRANSPARENT_CLASS);
    } else {
      currentColorPreviewEl.style.backgroundColor = currentColor;
      currentColorPreviewEl.classList.remove(TRANSPARENT_CLASS);
    }
  }

  function updateEraserActiveState() {
    if (!eraserBtn) return;
    eraserBtn.classList.toggle('active', currentColor === null);
  }

  // Single source of truth for "picking a color/tool": palette swatch clicks,
  // the eraser button, and the custom color input all funnel through here.
  function selectColor(color, selectedEl) {
    currentColor = color;
    clearSelectionHighlights();
    if (selectedEl) selectedEl.classList.add('selected');
    updateEraserActiveState();
    updateCurrentColorPreview();
  }

  // ---- palette events ----

  paletteEl.addEventListener('click', function (event) {
    var swatch = event.target.closest('.palette-swatch');
    if (!swatch) return;
    var color = swatch.dataset.color === 'transparent' ? null : swatch.dataset.color;
    selectColor(color, swatch);
  });

  if (customColorEl) {
    customColorEl.addEventListener('input', function (event) {
      selectColor(event.target.value, customColorEl);
    });
  }

  if (eraserBtn) {
    eraserBtn.addEventListener('click', function () {
      var transparentSwatch = paletteEl.querySelector('.palette-swatch-transparent');
      selectColor(null, transparentSwatch);
    });
  }

  // ---- painting ----

  function paintCell(cell) {
    if (!cell) return;
    var index = parseInt(cell.dataset.index, 10);
    if (isNaN(index) || index < 0 || index >= CELL_COUNT) return;
    pixels[index] = currentColor;
    cell.style.backgroundColor = currentColor || '';
  }

  pixelGridEl.addEventListener('mousedown', function (event) {
    var cell = event.target.closest('.pixel-cell');
    if (!cell) return;
    isDrawing = true;
    paintCell(cell);
  });

  pixelGridEl.addEventListener('mouseover', function (event) {
    if (!isDrawing) return;
    var cell = event.target.closest('.pixel-cell');
    if (!cell) return;
    paintCell(cell);
  });

  window.addEventListener('mouseup', function () {
    isDrawing = false;
  });

  // Optional touch support: preventDefault stops page scroll while drawing.
  pixelGridEl.addEventListener(
    'touchstart',
    function (event) {
      event.preventDefault();
      isDrawing = true;
      var touch = event.touches[0];
      if (!touch) return;
      var el = document.elementFromPoint(touch.clientX, touch.clientY);
      var cell = el && el.closest('.pixel-cell');
      paintCell(cell);
    },
    { passive: false }
  );

  pixelGridEl.addEventListener(
    'touchmove',
    function (event) {
      if (!isDrawing) return;
      event.preventDefault();
      var touch = event.touches[0];
      if (!touch) return;
      var el = document.elementFromPoint(touch.clientX, touch.clientY);
      var cell = el && el.closest('.pixel-cell');
      paintCell(cell);
    },
    { passive: false }
  );

  window.addEventListener('touchend', function () {
    isDrawing = false;
  });

  // ---- clear ----

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      pixels.fill(null);
      var cells = pixelGridEl.querySelectorAll('.pixel-cell');
      for (var i = 0; i < cells.length; i++) {
        cells[i].style.backgroundColor = '';
      }
    });
  }

  // ---- PNG export ----

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function formatTimestamp(date) {
    return (
      String(date.getFullYear()) +
      pad2(date.getMonth() + 1) +
      pad2(date.getDate()) +
      '-' +
      pad2(date.getHours()) +
      pad2(date.getMinutes()) +
      pad2(date.getSeconds())
    );
  }

  function drawExportCanvas() {
    var ctx = exportCanvas.getContext('2d');
    ctx.clearRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);
    for (var i = 0; i < CELL_COUNT; i++) {
      var color = pixels[i];
      if (color === null) continue;
      var row = Math.floor(i / GRID_SIZE);
      var col = i % GRID_SIZE;
      ctx.fillStyle = color;
      ctx.fillRect(col * SCALE, row * SCALE, SCALE, SCALE);
    }
  }

  function savePng() {
    drawExportCanvas();
    var dataUrl = exportCanvas.toDataURL('image/png');
    var fileName = 'pixel-art-' + formatTimestamp(new Date()) + '.png';
    var a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', savePng);
  }

  // ---- init ----

  function init() {
    var defaultSwatch = paletteEl.querySelector('.palette-swatch[data-color="' + DEFAULT_COLOR + '"]');
    selectColor(DEFAULT_COLOR, defaultSwatch);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
