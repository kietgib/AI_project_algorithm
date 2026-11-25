/**
 * TRẦN GIA KIỆT - 24110103
 * Mô phỏng thuật toán BFS & DFS trên bài toán 8-Puzzle
 */

// Trạng thái đích chuẩn của bài toán 8-Puzzle
const GOAL_STATE = [1, 2, 3, 4, 5, 6, 7, 8, 0];

// Các cấu hình ban đầu mẫu
const PRESETS = {
  notebook: [1, 2, 3, 4, 0, 6, 7, 5, 8], // Đề bài trong notebook colab (2 bước giải)
  easy1:    [1, 2, 3, 4, 5, 6, 7, 0, 8], // Cực ngắn (1 bước giải)
  medium4:  [1, 2, 3, 0, 4, 6, 7, 5, 8], // 4 bước giải
  medium6:  [0, 1, 3, 4, 2, 6, 7, 5, 8]  // 6 bước giải
};

// Biến trạng thái toàn cục
let currentAlgorithm = 'BFS';
let initialState = [...PRESETS.notebook];
let traceSteps = [];
let currentStepIndex = 0;
let isPlaying = false;
let playTimer = null;
let stepDelay = 400; // ms

// Lớp biểu diễn một Node trong không gian trạng thái
class PuzzleNode {
  constructor(state, parent = null, pathCost = 0, action = 'START') {
    this.state = state; // Mảng 9 phần tử
    this.parent = parent;
    this.pathCost = pathCost;
    this.action = action;
  }
}

// Chuyển mảng state sang chuỗi định dạng
function formatState(state) {
  return `(${state.join(', ')})`;
}

function stateToKey(state) {
  return state.join(',');
}

// Kiểm tra trạng thái hiện tại có phải đích hay không
function isGoal(state) {
  for (let i = 0; i < 9; i++) {
    if (state[i] !== GOAL_STATE[i]) return false;
  }
  return true;
}

// Sinh các trạng thái con hợp lệ (UP, DOWN, LEFT, RIGHT)
function expandNode(node) {
  const children = [];
  const state = node.state;
  const zeroIdx = state.indexOf(0);
  const row = Math.floor(zeroIdx / 3);
  const col = zeroIdx % 3;

  const moves = [
    { dr: -1, dc: 0, name: 'UP' },
    { dr: 1, dc: 0, name: 'DOWN' },
    { dr: 0, dc: -1, name: 'LEFT' },
    { dr: 0, dc: 1, name: 'RIGHT' }
  ];

  for (const m of moves) {
    const nr = row + m.dr;
    const nc = col + m.dc;
    if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3) {
      const newIdx = nr * 3 + nc;
      const nextState = [...state];
      nextState[zeroIdx] = nextState[newIdx];
      nextState[newIdx] = 0;

      children.push(new PuzzleNode(
        nextState,
        node,
        node.pathCost + 1,
        m.name
      ));
    }
  }
  return children;
}

// Hàm truy vết đường đi từ đích ngược về gốc
function traceSolution(node) {
  const path = [];
  let curr = node;
  while (curr !== null) {
    path.push({
      state: curr.state,
      action: curr.action,
      cost: curr.pathCost
    });
    curr = curr.parent;
  }
  path.reverse();
  return path;
}

// Thực thi thuật toán tìm kiếm và lưu lại toàn bộ vết từng bước
function runSearch(algo, startState) {
  const initialNode = new PuzzleNode([...startState], null, 0, 'START');
  const frontier = [initialNode]; // Hàng đợi (BFS) hoặc Ngăn xếp (DFS)
  const explored = new Set();
  const frontierSet = new Set([stateToKey(startState)]);

  const steps = [];
  let stepCounter = 0;
  let finalNode = null;
  const maxSteps = 1500;

  while (frontier.length > 0 && stepCounter < maxSteps) {
    // BFS: lấy từ đầu (shift), DFS: lấy từ cuối (pop)
    const currentNode = (algo === 'BFS') ? frontier.shift() : frontier.pop();
    const currKey = stateToKey(currentNode.state);
    frontierSet.delete(currKey);

    const goalReached = isGoal(currentNode.state);

    // Snapshot các node trong Frontier dạng danh sách gọn nhẹ
    const frontierSnapshot = frontier.map(n => ({
      state: [...n.state],
      action: n.action,
      cost: n.pathCost
    }));

    steps.push({
      step: stepCounter,
      node: currentNode,
      action: currentNode.action,
      isGoal: goalReached,
      frontierSnapshot: frontierSnapshot,
      exploredCount: explored.size
    });

    if (goalReached) {
      finalNode = currentNode;
      break;
    }

    explored.add(currKey);

    const children = expandNode(currentNode);
    // Trong DFS, đảo ngược danh sách con để giữ thứ tự duyệt ưu tiên UP/DOWN/LEFT/RIGHT
    const orderedChildren = (algo === 'DFS') ? [...children].reverse() : children;

    for (const child of orderedChildren) {
      const childKey = stateToKey(child.state);
      if (!explored.has(childKey) && !frontierSet.has(childKey)) {
        frontier.push(child);
        frontierSet.add(childKey);
      }
    }

    stepCounter++;
  }

  const solutionPath = finalNode ? traceSolution(finalNode) : null;
  return {
    steps,
    solutionPath,
    finalNode,
    totalExplored: explored.size
  };
}

/* ========================================================
   RENDERERS (Giao diện đơn giản, thoáng, dạng List)
   ======================================================== */

// 1. Vẽ bàn cờ 3x3 của Node hiện tại
function renderPuzzleBoard(state, action, parentState) {
  const container = document.getElementById('puzzleBoard');
  container.innerHTML = '';

  state.forEach((val, idx) => {
    const tile = document.createElement('div');
    tile.className = `puzzle-tile ${val === 0 ? 'empty' : ''}`;

    if (parentState && val !== 0) {
      const prevZeroIdx = parentState.indexOf(0);
      if (idx === prevZeroIdx) {
        tile.classList.add('moved');
      }
    }

    if (val !== 0 && val === GOAL_STATE[idx]) {
      tile.classList.add('correct');
    }

    tile.textContent = val !== 0 ? val : '';
    container.appendChild(tile);
  });
}

// 2. Hiển thị danh sách Frontier dạng List đơn giản
function renderFrontierList(frontierSnapshot, algo) {
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
        <span class="list-state">${formatState(item.state)}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 0.35rem;">
        <span class="list-action-tag">${item.action} (g=${item.cost})</span>
        ${isNext ? '<span style="font-size: 0.65rem; background: #2563eb; color: #fff; padding: 1px 4px; border-radius: 3px; font-weight: bold;">Kế tiếp</span>' : ''}
      </div>
    `;

    // Click vào item trong frontier để xem nhanh trạng thái
    row.onclick = () => {
      renderPuzzleBoard(item.state, item.action, null);
      document.getElementById('stateTupleText').textContent = formatState(item.state);
      document.getElementById('nodeCostText').textContent = item.cost;
      document.getElementById('nodeActionText').textContent = item.action;
    };

    listEl.appendChild(row);
  });
}

// 3. Hiển thị Endpoint & Danh sách đường đi lời giải dạng List đơn giản
function renderEndpoint(solutionPath, isGoalCurrent, currentStep) {
  const statusEl = document.getElementById('endpointStatus');
  const pathListEl = document.getElementById('solutionPathList');
  const pathCountBadge = document.getElementById('solutionCountBadge');

  if (isGoalCurrent) {
    statusEl.className = 'endpoint-status status-found';
    statusEl.innerHTML = `<span>✓ ĐÃ TÌM THẤY ĐÍCH!</span> <span>Step ${currentStep}</span>`;
  } else {
    statusEl.className = 'endpoint-status status-searching';
    statusEl.innerHTML = `<span>⏳ Đang duyệt tìm kiếm...</span> <span>is_goal: False</span>`;
  }

  pathListEl.innerHTML = '';

  if (!solutionPath || solutionPath.length === 0) {
    pathCountBadge.textContent = '0 bước';
    pathListEl.innerHTML = `<div style="color: var(--text-light); text-align: center; padding: 2rem 0; font-size: 0.8rem;">Đang tìm đường đi...</div>`;
    return;
  }

  pathCountBadge.textContent = `${solutionPath.length - 1} di chuyển`;

  solutionPath.forEach((p, idx) => {
    const item = document.createElement('div');
    item.className = 'path-step-item';
    const isGoalStep = (idx === solutionPath.length - 1);

    item.innerHTML = `
      <div>
        <span class="path-step-num">Step ${idx}:</span>
        <span style="font-family: monospace;">${formatState(p.state)}</span>
      </div>
      <div>
        <span class="list-action-tag" style="${isGoalStep ? 'background:#ecfdf5; color:#059669; font-weight:bold;' : ''}">
          ${p.action}
        </span>
      </div>
    `;

    item.onclick = () => {
      renderPuzzleBoard(p.state, p.action, null);
      document.getElementById('stateTupleText').textContent = formatState(p.state);
      document.getElementById('nodeCostText').textContent = p.cost;
      document.getElementById('nodeActionText').textContent = p.action;
    };

    pathListEl.appendChild(item);
  });
}

// 4. Hiển thị bảng chi tiết từng Step
function renderTraceTable(steps) {
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
      <td style="color: var(--primary); font-weight: 600;">${formatState(s.node.state)}</td>
      <td><span class="list-action-tag">${s.action}</span></td>
      <td>${frontierBrief}</td>
      <td>${s.exploredCount} nodes</td>
      <td>${s.isGoal ? '<span style="color: #059669; font-weight: 800;">✓ TRUE (GOAL)</span>' : '<span style="color: #94a3b8;">False</span>'}</td>
    `;

    tr.onclick = () => {
      pausePlayback();
      applyStep(idx);
    };

    tbody.appendChild(tr);
  });
}

/* ========================================================
   CONTROLLER & PLAYBACK
   ======================================================== */

// Cập nhật giao diện tại một bước cụ thể
function applyStep(index) {
  if (index < 0 || index >= traceSteps.length) return;
  currentStepIndex = index;
  const s = traceSteps[index];

  // Bàn cờ & Node
  const parentState = s.node.parent ? s.node.parent.state : null;
  renderPuzzleBoard(s.node.state, s.action, parentState);

  document.getElementById('stateTupleText').textContent = formatState(s.node.state);
  document.getElementById('nodeCostText').textContent = s.node.pathCost;
  document.getElementById('nodeDepthText').textContent = s.node.pathCost;
  document.getElementById('nodeActionText').textContent = s.action;

  // Frontier list
  renderFrontierList(s.frontierSnapshot, currentAlgorithm);

  // Endpoint status
  renderEndpoint(window.latestSolutionPath, s.isGoal, s.step);

  // Chỉ báo tiến độ
  document.getElementById('stepProgressIndicator').textContent = `${index + 1} / ${traceSteps.length}`;

  // Highlight hàng trong bảng
  document.querySelectorAll('#traceTableBody tr').forEach(r => r.classList.remove('active-row'));
  const activeRow = document.getElementById(`trace-step-${index}`);
  if (activeRow) {
    activeRow.classList.add('active-row');
    activeRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Cập nhật trạng thái nút
  document.getElementById('btnPrev').disabled = (index === 0);
  document.getElementById('btnNext').disabled = (index === traceSteps.length - 1);
}

// Khởi chạy thuật toán và reset dữ liệu hiển thị
function initializeSearch() {
  pausePlayback();

  const searchResult = runSearch(currentAlgorithm, initialState);
  traceSteps = searchResult.steps;
  window.latestSolutionPath = searchResult.solutionPath;

  renderTraceTable(traceSteps);
  applyStep(0);
}

// Chọn thuật toán BFS hoặc DFS
function selectAlgorithm(algo) {
  currentAlgorithm = algo;
  document.getElementById('tabBFS').classList.toggle('active', algo === 'BFS');
  document.getElementById('tabDFS').classList.toggle('active', algo === 'DFS');

  const frontierTypeBadge = document.getElementById('frontierTypeBadge');
  frontierTypeBadge.textContent = (algo === 'BFS') ? 'FIFO Queue' : 'LIFO Stack';

  initializeSearch();
}

// Chọn cấu hình mẫu
function applyPreset(presetKey) {
  const customBox = document.getElementById('customInputBox');
  if (presetKey === 'custom') {
    customBox.style.display = 'flex';
    return;
  }
  customBox.style.display = 'none';

  if (PRESETS[presetKey]) {
    initialState = [...PRESETS[presetKey]];
    initializeSearch();
  }
}

// Áp dụng mảng nhập tự do
function setCustomState() {
  const val = document.getElementById('customStateInput').value;
  const parts = val.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
  if (parts.length !== 9) {
    alert('Vui lòng nhập đủ 9 số từ 0 đến 8!');
    return;
  }
  initialState = parts;
  initializeSearch();
}

// Xáo trộn ngẫu nhiên hợp lệ (solvable)
function shuffleInitialState(steps = 3) {
  let curr = [...GOAL_STATE];
  for (let s = 0; s < steps; s++) {
    const dummyNode = new PuzzleNode(curr);
    const children = expandNode(dummyNode);
    const rand = children[Math.floor(Math.random() * children.length)];
    curr = [...rand.state];
  }
  initialState = curr;
  document.getElementById('presetSelect').value = 'custom';
  document.getElementById('customInputBox').style.display = 'flex';
  document.getElementById('customStateInput').value = curr.join(', ');
  initializeSearch();
}

// Playback: Tự động chạy
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

function jumpToEnd() {
  pausePlayback();
  applyStep(traceSteps.length - 1);
}

// Điều chỉnh tốc độ
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

// Sao chép bảng ra Markdown
function copyTableData() {
  let md = `| Step | Node State | Action | Explored | Goal |\n|---|---|---|---|---|\n`;
  traceSteps.forEach(s => {
    md += `| ${s.step} | ${formatState(s.node.state)} | ${s.action} | ${s.exploredCount} | ${s.isGoal ? 'TRUE' : 'False'} |\n`;
  });
  navigator.clipboard.writeText(md).then(() => {
    alert('Đã sao chép bảng Markdown vào bộ nhớ tạm!');
  });
}

// Phím tắt điều khiển (Space: Play/Pause, Phím mũi tên: Tiến/Lùi)
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

// Khởi chạy khi tài liệu tải xong
window.onload = function() {
  initializeSearch();
};
