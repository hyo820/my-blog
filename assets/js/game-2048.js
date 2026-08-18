(function () {
  var SIZE = 4;
  var STORAGE_KEY = 'game2048.best';
  var WIN_VALUE = 2048;
  var WIN_MESSAGE = 'You Win! 🎉';
  var LOSE_MESSAGE = 'Game Over';

  var scoreCurrentEl = document.getElementById('score-current');
  var scoreBestEl = document.getElementById('score-best');
  var newGameBtn = document.getElementById('new-game-btn');
  var overlayNewGameBtn = document.getElementById('overlay-new-game-btn');
  var continueBtn = document.getElementById('continue-btn');
  var overlayEl = document.getElementById('game-overlay');
  var overlayMessageEl = document.getElementById('overlay-message');
  var tileLayerEl = document.getElementById('tile-layer');

  if (!tileLayerEl || !overlayEl) return;

  var board = createEmptyBoard();
  var score = 0;
  var best = 0;
  var hasWonThisRound = false;

  // ---- board helpers ----

  function createEmptyBoard() {
    var b = [];
    for (var r = 0; r < SIZE; r++) {
      b.push([0, 0, 0, 0]);
    }
    return b;
  }

  function cloneBoard(source) {
    return source.map(function (row) {
      return row.slice();
    });
  }

  function boardsEqual(a, b) {
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (a[r][c] !== b[r][c]) return false;
      }
    }
    return true;
  }

  function getEmptyCells(b) {
    var cells = [];
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (b[r][c] === 0) cells.push([r, c]);
      }
    }
    return cells;
  }

  function addRandomTile(b) {
    var empty = getEmptyCells(b);
    if (empty.length === 0) return false;
    var pick = empty[Math.floor(Math.random() * empty.length)];
    b[pick[0]][pick[1]] = Math.random() < 0.9 ? 2 : 4;
    return true;
  }

  function boardHasValue(b, value) {
    return b.some(function (row) {
      return row.indexOf(value) !== -1;
    });
  }

  function boardFull(b) {
    return b.every(function (row) {
      return row.every(function (v) {
        return v !== 0;
      });
    });
  }

  function canMerge(b) {
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        var v = b[r][c];
        if (c < SIZE - 1 && b[r][c + 1] === v) return true;
        if (r < SIZE - 1 && b[r + 1][c] === v) return true;
      }
    }
    return false;
  }

  function isGameOver(b) {
    return boardFull(b) && !canMerge(b);
  }

  // Slides one line of 4 values toward index 0, merging equal adjacent
  // values at most once each. Returns { line, gained }.
  function slideLine(line) {
    var filtered = line.filter(function (v) {
      return v !== 0;
    });
    var merged = [];
    var gained = 0;
    var i = 0;
    while (i < filtered.length) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        var value = filtered[i] * 2;
        merged.push(value);
        gained += value;
        i += 2;
      } else {
        merged.push(filtered[i]);
        i += 1;
      }
    }
    while (merged.length < SIZE) merged.push(0);
    return { line: merged, gained: gained };
  }

  // direction: 'up' | 'down' | 'left' | 'right'
  function moveBoard(b, direction) {
    var newBoard = createEmptyBoard();
    var gained = 0;
    var r, c, line, result, resultLine;

    if (direction === 'left' || direction === 'right') {
      for (r = 0; r < SIZE; r++) {
        line = b[r].slice();
        if (direction === 'right') line.reverse();
        result = slideLine(line);
        resultLine = result.line;
        if (direction === 'right') resultLine.reverse();
        newBoard[r] = resultLine;
        gained += result.gained;
      }
    } else {
      for (c = 0; c < SIZE; c++) {
        line = [b[0][c], b[1][c], b[2][c], b[3][c]];
        if (direction === 'down') line.reverse();
        result = slideLine(line);
        resultLine = result.line;
        if (direction === 'down') resultLine.reverse();
        for (r = 0; r < SIZE; r++) newBoard[r][c] = resultLine[r];
        gained += result.gained;
      }
    }

    return {
      board: newBoard,
      gained: gained,
      moved: !boardsEqual(b, newBoard)
    };
  }

  // ---- persistence ----

  function loadBest() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? parseInt(raw, 10) : 0;
      best = isNaN(parsed) ? 0 : parsed;
    } catch (e) {
      best = 0;
    }
  }

  function saveBest() {
    try {
      localStorage.setItem(STORAGE_KEY, String(best));
    } catch (e) {
      // localStorage unavailable: best-score persistence silently disabled.
    }
  }

  // ---- rendering ----

  function renderScore() {
    scoreCurrentEl.textContent = String(score);
    scoreBestEl.textContent = String(best);
  }

  function renderTiles() {
    tileLayerEl.innerHTML = '';
    var frag = document.createDocumentFragment();
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        var value = board[r][c];
        if (value === 0) continue;
        var tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.value = String(value);
        tile.style.gridColumn = String(c + 1);
        tile.style.gridRow = String(r + 1);
        tile.textContent = String(value);
        frag.appendChild(tile);
      }
    }
    tileLayerEl.appendChild(frag);
  }

  function render() {
    renderTiles();
    renderScore();
  }

  function showOverlay(message, isWin) {
    overlayMessageEl.textContent = message;
    continueBtn.hidden = !isWin;
    overlayEl.hidden = false;
  }

  function closeOverlay() {
    overlayEl.hidden = true;
  }

  function isOverlayOpen() {
    return !overlayEl.hidden;
  }

  // ---- score/game state updates ----

  function addScore(amount) {
    if (amount <= 0) return;
    score += amount;
    if (score > best) {
      best = score;
      saveBest();
    }
  }

  function checkWinAndLoss() {
    if (!hasWonThisRound && boardHasValue(board, WIN_VALUE)) {
      hasWonThisRound = true;
      showOverlay(WIN_MESSAGE, true);
      return;
    }
    if (isGameOver(board)) {
      showOverlay(LOSE_MESSAGE, false);
    }
  }

  // ---- game actions ----

  function newGame() {
    board = createEmptyBoard();
    score = 0;
    hasWonThisRound = false;
    addRandomTile(board);
    addRandomTile(board);
    closeOverlay();
    render();
  }

  function handleMove(direction) {
    if (isOverlayOpen()) return;

    var result = moveBoard(board, direction);
    if (!result.moved) return;

    board = result.board;
    addScore(result.gained);
    addRandomTile(board);
    render();
    checkWinAndLoss();
  }

  // ---- input ----

  var KEY_DIRECTIONS = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right'
  };

  document.addEventListener('keydown', function (e) {
    var direction = KEY_DIRECTIONS[e.key];
    if (!direction) return;
    e.preventDefault();
    handleMove(direction);
  });

  var touchStartX = null;
  var touchStartY = null;
  var SWIPE_THRESHOLD = 30;

  document.addEventListener(
    'touchstart',
    function (e) {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    },
    { passive: true }
  );

  document.addEventListener('touchend', function (e) {
    if (touchStartX === null || touchStartY === null) return;
    var touch = e.changedTouches[0];
    var dx = touch.clientX - touchStartX;
    var dy = touch.clientY - touchStartY;
    touchStartX = null;
    touchStartY = null;

    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;

    var direction;
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'right' : 'left';
    } else {
      direction = dy > 0 ? 'down' : 'up';
    }
    handleMove(direction);
  });

  if (newGameBtn) newGameBtn.addEventListener('click', newGame);
  if (overlayNewGameBtn) overlayNewGameBtn.addEventListener('click', newGame);
  if (continueBtn) {
    continueBtn.addEventListener('click', function () {
      closeOverlay();
    });
  }

  // ---- init ----

  function init() {
    loadBest();
    renderScore();
    newGame();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
