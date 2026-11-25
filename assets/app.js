/**
 * TRẦN GIA KIỆT - 24110103
 * Mô phỏng thuật toán tìm kiếm BFS & DFS trên bài toán 8-Puzzle
 */

// Lớp biểu diễn một Node trong cây tìm kiếm
class SearchNode {
  constructor(state, parent = null, pathCost = 0, action = 'START') {
    this.state = state;
    this.parent = parent;
    this.pathCost = pathCost; // Chi phí đường đi: mỗi bước di chuyển tăng 1
    this.action = action;
  }
}

/* ========================================================
   ĐỊNH NGHĨA BÀI TOÁN 8-PUZZLE
   ======================================================== */
const PROBLEMS = {
  '8puzzle': {
    id: '8puzzle',
    name: 'Bài toán 8-Puzzle',
    subtitle: 'Xếp các ô số 1-8 và ô trống 0 về vị trí đích',
    defaultState: [1, 2, 3, 4, 0, 6, 7, 5, 8],
    goalState: [1, 2, 3, 4, 5, 6, 7, 8, 0],
    presets: [
      { id: 'default', name: '★ Đề bài mặc định', state: [1, 2, 3, 4, 0, 6, 7, 5, 8] }
    ],
    formatState: (state) => `(${state.join(', ')})`,
    stateToKey: (state) => state.join(','),
    isGoal: function(state) {
      for (let i = 0; i < 9; i++) {
        if (state[i] !== this.goalState[i]) return false;
      }
      return true;
    },
    // Sinh các nút con theo ĐÚNG THỨ TỰ: UP -> DOWN -> LEFT -> RIGHT
    expand: function(node) {
      const children = [];
      const state = node.state;
      const zeroIdx = state.indexOf(0);
      const row = Math.floor(zeroIdx / 3);
      const col = zeroIdx % 3;

      // Thứ tự hành động chuẩn xác: UP (-1,0), DOWN (1,0), LEFT (0,-1), RIGHT (0,1)
      const actions = [
        { dr: -1, dc: 0, name: 'UP' },
        { dr: 1, dc: 0, name: 'DOWN' },
        { dr: 0, dc: -1, name: 'LEFT' },
        { dr: 0, dc: 1, name: 'RIGHT' }
      ];

      for (const m of actions) {
        const nr = row + m.dr;
        const nc = col + m.dc;
        if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3) {
          const newIdx = nr * 3 + nc;
          const nextState = [...state];
          nextState[zeroIdx] = nextState[newIdx];
          nextState[newIdx] = 0;

          // Mỗi lần di chuyển path_cost tăng đúng 1 bước
          children.push(new SearchNode(
            nextState,
            node,
            node.pathCost + 1,
            m.name
          ));
        }
      }
      return children;
    },
    renderVisual: function(state, container, action, parentState) {
      container.innerHTML = '';
      const board = document.createElement('div');
      board.className = 'puzzle-board';

      state.forEach((val, idx) => {
        const tile = document.createElement('div');
        tile.className = `puzzle-tile ${val === 0 ? 'empty' : ''}`;

        // Đánh dấu ô vừa di chuyển từ vị trí ô trống của trạng thái trước
        if (parentState && val !== 0) {
          const prevZeroIdx = parentState.indexOf(0);
          if (idx === prevZeroIdx) tile.classList.add('moved');
        }

        // Đánh dấu ô nằm đúng vị trí đích
        if (val !== 0 && val === this.goalState[idx]) {
          tile.classList.add('correct');
        }

        tile.textContent = val !== 0 ? val : '';
        board.appendChild(tile);
      });

      container.appendChild(board);
    }
  }
};

if (typeof window !== 'undefined') {
  window.PROBLEMS = PROBLEMS;
  window.runSearch = runSearch;
}

/* ========================================================
   BIẾN TOÀN CỤC & ĐIỀU KHIỂN
   ======================================================== */
let currentProblemId = '8puzzle';
let currentAlgorithm = 'BFS';
let currentState = [...PROBLEMS['8puzzle'].defaultState];

let traceSteps = [];          // Danh sách các bước duyệt (Step 1, 2, 3...)
let solutionPath = [];        // Danh sách các bước đường đi lời giải

let currentStepIndex = 0;
let isPlaying = false;
let playTimer = null;
let stepDelay = 400; // ms

function getCurrentProblem() {
  return PROBLEMS[currentProblemId];
}

/* ========================================================
   THUẬT TOÁN TÌM KIẾM BFS VÀ DFS
   ======================================================== */
function runSearch(algo, startState, problem) {
  const initialNode = new SearchNode([...startState], null, 0, 'START');
  const frontier = [initialNode];
  const explored = new Set();
  const frontierSet = new Set([problem.stateToKey(startState)]);

  const steps = [];
  let stepCounter = 1; // Step bắt đầu tính từ 1 để dễ đếm
  let finalNode = null;
  const maxSteps = 1500;

  while (frontier.length > 0 && steps.length < maxSteps) {
    // BFS: dequeue từ đầu (FIFO) | DFS: pop từ cuối (LIFO)
    const currentNode = (algo === 'BFS') ? frontier.shift() : frontier.pop();
    const currKey = problem.stateToKey(currentNode.state);
    frontierSet.delete(currKey);

    const goalReached = problem.isGoal(currentNode.state);

    // Snapshot các node đang chờ trong Frontier
    const frontierSnapshot = frontier.map(n => ({
      state: [...n.state],
      action: n.action,
      cost: n.pathCost
    }));

    steps.push({
      step: stepCounter,
      node: currentNode,
      action: currentNode.action,
      cost: currentNode.pathCost,
      isGoal: goalReached,
      frontierSnapshot: frontierSnapshot,
      exploredCount: explored.size,
      parentState: currentNode.parent ? currentNode.parent.state : null
    });

    if (goalReached) {
      finalNode = currentNode;
      break;
    }

    explored.add(currKey);

    // Sinh các node con theo thứ tự: UP, DOWN, LEFT, RIGHT
    const children = problem.expand(currentNode);

    // Với DFS (LIFO Stack), để duyệt theo thứ tự UP, DOWN, LEFT, RIGHT:
    // ta đưa vào ngăn xếp theo thứ tự ngược lại để UP nằm ở đỉnh ngăn xếp được pop trước!
    const orderedChildren = (algo === 'DFS') ? [...children].reverse() : children;

    for (const child of orderedChildren) {
      const childKey = problem.stateToKey(child.state);
      if (!explored.has(childKey) && !frontierSet.has(childKey)) {
        frontier.push(child);
        frontierSet.add(childKey);
      }
    }

    stepCounter++;
  }

  // Truy vết lời giải
  let path = null;
  if (finalNode) {
    path = [];
    let curr = finalNode;
    while (curr !== null) {
      path.push({
        state: curr.state,
        action: curr.action,
        cost: curr.pathCost,
        parentState: curr.parent ? curr.parent.state : null
      });
      curr = curr.parent;
    }
    path.reverse();
  }

  return {
    steps,
    solutionPath: path,
    finalNode,
    totalExplored: explored.size
  };
}

/* ========================================================
   RENDERERS & GIAO DIỆN
   ======================================================== */

// Cập nhật lại UI tại một bước cụ thể
function applyStep(index) {
  if (index < 0 || index >= traceSteps.length) return;
  currentStepIndex = index;
  const s = traceSteps[index];
  const problem = getCurrentProblem();

  // 1. Vẽ bàn cờ Node
  const container = document.getElementById('visualContainer');
  problem.renderVisual(s.node.state, container, s.action, s.parentState);

  document.getElementById('stateTupleText').textContent = problem.formatState(s.node.state);
  document.getElementById('nodeCostText').textContent = s.cost;
  document.getElementById('nodeDepthText').textContent = s.cost;
  document.getElementById('nodeActionText').textContent = s.action;

  // 2. Vẽ Frontier dạng List
  renderFrontierList(s.frontierSnapshot, currentAlgorithm, problem);

  // 3. Vẽ Endpoint
  renderEndpoint(solutionPath, s.isGoal, s.step, problem);

  // 4. Chỉ báo tiến độ bước (Bắt đầu từ 1)
  document.getElementById('stepProgressIndicator').textContent = `${s.step} / ${traceSteps.length}`;

  // 5. Highlight hàng trong bảng
  document.querySelectorAll('#traceTableBody tr').forEach(r => r.classList.remove('active-row'));
  const activeRow = document.getElementById(`trace-step-${index}`);
  if (activeRow) {
    activeRow.classList.add('active-row');
    activeRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Cập nhật trạng thái nút bấm
  document.getElementById('btnPrev').disabled = (index === 0);
  document.getElementById('btnNext').disabled = (index === traceSteps.length - 1);
}

// Hiển thị Frontier dạng List
function renderFrontierList(frontierSnapshot, algo, problem) {
  const listEl = document.getElementById('frontierList');
  const countBadge = document.getElementById('frontierCountBadge');

  countBadge.textContent = `${frontierSnapshot.length} nodes`;
  listEl.innerHTML = '';

  if (frontierSnapshot.length === 0) {
    listEl.innerHTML = `<div style="color: var(--text-light); text-align: center; padding: 2rem 0; font-size: 0.8rem;">Frontier rỗng (0 node)</div>`;
    return;
  }

  frontierSnapshot.forEach((item, idx) => {
    const row = document.createElement('div');
    const isNext = (algo === 'BFS' && idx === 0) || (algo === 'DFS' && idx === frontierSnapshot.length - 1);
    row.className = `list-item ${isNext ? 'highlight-next' : ''}`;

    row.innerHTML = `
      <div>
        <span class="list-idx">#${idx + 1}</span>
        <span class="list-state">${problem.formatState(item.state)}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 0.35rem;">
        <span class="list-action-tag">${item.action} (g=${item.cost})</span>
        ${isNext ? '<span style="font-size: 0.65rem; background: #2563eb; color: #fff; padding: 1px 4px; border-radius: 3px; font-weight: bold;">Kế tiếp</span>' : ''}
      </div>
    `;

    row.onclick = () => {
      const container = document.getElementById('visualContainer');
      problem.renderVisual(item.state, container, item.action, null);
      document.getElementById('stateTupleText').textContent = problem.formatState(item.state);
      document.getElementById('nodeCostText').textContent = item.cost;
      document.getElementById('nodeActionText').textContent = item.action;
    };

    listEl.appendChild(row);
  });
}

// Hiển thị Endpoint & Danh sách đường đi lời giải dạng List
function renderEndpoint(solPath, isGoalCurrent, currentStep, problem) {
  const statusEl = document.getElementById('endpointStatus');
  const pathListEl = document.getElementById('solutionPathList');
  const pathCountBadge = document.getElementById('solutionCountBadge');

  if (isGoalCurrent) {
    statusEl.className = 'endpoint-status status-found';
    statusEl.innerHTML = `<span>✓ ĐÃ TÌM THẤY ĐÍCH!</span> <span>Step ${currentStep}</span>`;
  } else {
    statusEl.className = 'endpoint-status status-searching';
    statusEl.innerHTML = `<span>⏳ Đang duyệt tìm kiếm...</span> <span>Step ${currentStep}</span>`;
  }

  pathListEl.innerHTML = '';

  if (!solPath || solPath.length === 0) {
    pathCountBadge.textContent = '0 bước';
    pathListEl.innerHTML = `<div style="color: var(--text-light); text-align: center; padding: 2rem 0; font-size: 0.8rem;">Đang tìm đường đi...</div>`;
    return;
  }

  pathCountBadge.textContent = `${solPath.length} steps (${solPath.length - 1} di chuyển)`;

  solPath.forEach((p, idx) => {
    const item = document.createElement('div');
    item.className = 'path-step-item';
    const isGoalStep = (idx === solPath.length - 1);

    item.innerHTML = `
      <div>
        <span class="path-step-num">Step ${idx + 1}:</span>
        <span style="font-family: monospace;">${problem.formatState(p.state)}</span>
      </div>
      <div style="display: flex; gap: 0.35rem; align-items: center;">
        <span style="font-size: 0.72rem; color: var(--text-muted);">Cost: <strong>${p.cost}</strong></span>
        <span class="list-action-tag" style="${isGoalStep ? 'background:#ecfdf5; color:#059669; font-weight:bold;' : ''}">
          ${p.action}
        </span>
      </div>
    `;

    item.onclick = () => {
      pausePlayback();
      const container = document.getElementById('visualContainer');
      problem.renderVisual(p.state, container, p.action, p.parentState);
      document.getElementById('stateTupleText').textContent = problem.formatState(p.state);
      document.getElementById('nodeCostText').textContent = p.cost;
      document.getElementById('nodeActionText').textContent = p.action;
    };

    pathListEl.appendChild(item);
  });
}

// Hiển thị bảng chi tiết từng Step (Search Trace Table)
function renderTraceTable(steps, problem) {
  const tbody = document.getElementById('traceTableBody');
  tbody.innerHTML = '';

  steps.forEach((s, idx) => {
    const tr = document.createElement('tr');
    tr.id = `trace-step-${idx}`;
    if (s.isGoal) tr.classList.add('goal-row');

    const frontierBrief = s.frontierSnapshot.length > 0
      ? `[${s.frontierSnapshot.length} nodes]`
      : '[]';

    tr.innerHTML = `
      <td><strong>${s.step}</strong></td>
      <td style="color: var(--primary); font-weight: 600;">${problem.formatState(s.node.state)}</td>
      <td><span class="list-action-tag">${s.action}</span></td>
      <td><strong>${s.cost}</strong></td>
      <td>${frontierBrief}</td>
      <td>${s.exploredCount} nodes</td>
      <td>${s.isGoal ? '<span style="color: #059669; font-weight: 800;">✓ ĐÍCH (GOAL)</span>' : '<span style="color: #94a3b8;">False</span>'}</td>
    `;

    tr.onclick = () => {
      pausePlayback();
      applyStep(idx);
    };

    tbody.appendChild(tr);
  });
}

/* ========================================================
   SỰ KIỆN THAY ĐỔI & ĐIỀU KHIỂN
   ======================================================== */

// Khởi chạy lại toàn bộ thuật toán
function initializeSearch() {
  pausePlayback();
  const problem = getCurrentProblem();

  const searchResult = runSearch(currentAlgorithm, currentState, problem);
  traceSteps = searchResult.steps;
  solutionPath = searchResult.solutionPath;

  renderTraceTable(traceSteps, problem);
  applyStep(0);
}

// 1. Khi đổi bài toán
function onProblemChange(problemId) {
  currentProblemId = problemId;
  const problem = getCurrentProblem();
  populatePresets(problem);
  currentState = [...problem.defaultState];
  document.getElementById('customStateInput').value = problem.defaultState.join(', ');
  initializeSearch();
}

// 2. Khi đổi thuật toán (BFS / DFS)
function onAlgorithmChange(algoName) {
  currentAlgorithm = algoName;
  const badge = document.getElementById('frontierTypeBadge');
  badge.textContent = (algoName === 'BFS') ? 'FIFO Queue' : 'LIFO Stack';
  initializeSearch();
}

// 3. Khi đổi đề bài mẫu
function onPresetChange(presetId) {
  const problem = getCurrentProblem();
  const customBox = document.getElementById('customInputBox');

  if (presetId === 'custom') {
    customBox.style.display = 'flex';
    return;
  }
  customBox.style.display = 'none';

  const preset = problem.presets.find(p => p.id === presetId);
  if (preset) {
    currentState = [...preset.state];
    document.getElementById('customStateInput').value = preset.state.join(', ');
    initializeSearch();
  }
}

// Điền các option presets vào combo box (chỉ chừa Đề bài mặc định & Tự nhập trạng thái)
function populatePresets(problem) {
  const select = document.getElementById('presetSelect');
  select.innerHTML = '';

  problem.presets.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    select.appendChild(opt);
  });

  const customOpt = document.createElement('option');
  customOpt.value = 'custom';
  customOpt.textContent = '✏ Tự nhập trạng thái';
  select.appendChild(customOpt);
}

// Tự nhập mảng trạng thái
function setCustomState() {
  const val = document.getElementById('customStateInput').value.trim();
  const parts = val.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
  if (parts.length !== 9) {
    alert('Vui lòng nhập đúng 9 chữ số từ 0 đến 8 cách nhau bởi dấu phẩy!');
    return;
  }
  currentState = parts;
  initializeSearch();
}

// Playback Controls
function togglePlayPause() {
  if (isPlaying) {
    pausePlayback();
  } else {
    startPlayback();
  }
}

function startPlayback() {
  if (currentStepIndex >= traceSteps.length - 1) {
    currentStepIndex = 0;
  }
  isPlaying = true;
  document.getElementById('playIcon').textContent = '⏸';
  document.getElementById('playText').textContent = 'Tạm dừng';

  playTimer = setInterval(() => {
    if (currentStepIndex < traceSteps.length - 1) {
      applyStep(currentStepIndex + 1);
    } else {
      pausePlayback();
    }
  }, stepDelay);
}

function pausePlayback() {
  isPlaying = false;
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
  }
  document.getElementById('playIcon').textContent = '▶';
  document.getElementById('playText').textContent = 'Chạy';
}

function stepNext() {
  pausePlayback();
  if (currentStepIndex < traceSteps.length - 1) {
    applyStep(currentStepIndex + 1);
  }
}

function stepPrev() {
  pausePlayback();
  if (currentStepIndex > 0) {
    applyStep(currentStepIndex - 1);
  }
}

function resetPlayback() {
  pausePlayback();
  applyStep(0);
}

function updateSpeed(val) {
  stepDelay = parseInt(val, 10);
  document.getElementById('speedText').textContent = `${stepDelay} ms`;
  if (isPlaying) {
    pausePlayback();
    startPlayback();
  }
}

// Modal Helpers
function openModal(id) {
  document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

function copyTableData() {
  const problem = getCurrentProblem();
  let md = `| Step | State | Action | Path Cost | Explored | Goal |\n|---|---|---|---|---|---|\n`;
  traceSteps.forEach((s) => {
    md += `| ${s.step} | ${problem.formatState(s.node.state)} | ${s.action} | ${s.cost} | ${s.exploredCount} | ${s.isGoal ? 'TRUE' : 'False'} |\n`;
  });
  navigator.clipboard.writeText(md).then(() => {
    alert('Đã sao chép bảng Markdown vào bộ nhớ tạm!');
  });
}

// Phím tắt điều khiển
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (e.code === 'Space') {
    e.preventDefault();
    togglePlayPause();
  } else if (e.code === 'ArrowRight') {
    stepNext();
  } else if (e.code === 'ArrowLeft') {
    stepPrev();
  }
});

// Khởi chạy khi load trang
window.onload = function() {
  populatePresets(getCurrentProblem());
  initializeSearch();
};
