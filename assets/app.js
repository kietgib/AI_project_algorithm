/**
 * TRẦN GIA KIỆT - 24110103
 * Kiến trúc Backend & Thuật toán tìm kiếm BFS & DFS đa bài toán (Multi-Problem Architecture)
 */

// Lớp biểu diễn một Node trong không gian trạng thái
class SearchNode {
  constructor(state, parent = null, pathCost = 0, action = 'START') {
    this.state = state;
    this.parent = parent;
    this.pathCost = pathCost;
    this.action = action;
  }
}

/* ========================================================
   ĐỊNH NGHĨA CÁC BÀI TOÁN (PROBLEM REGISTRY)
   Dễ dàng bổ sung bài toán mới chỉ cần khai báo thêm vào đây!
   ======================================================== */
const PROBLEMS = {
  // 1. BÀI TOÁN 8-PUZZLE
  '8puzzle': {
    id: '8puzzle',
    name: 'Bài toán 8-Puzzle',
    subtitle: 'Xếp các ô số 1-8 và ô trống 0 về vị trí đích',
    defaultState: [1, 2, 3, 4, 0, 6, 7, 5, 8],
    goalState: [1, 2, 3, 4, 5, 6, 7, 8, 0],
    presets: [
      { id: 'notebook', name: '★ Notebook Colab (2 bước giải)', state: [1, 2, 3, 4, 0, 6, 7, 5, 8] },
      { id: 'easy1', name: 'Rất ngắn (1 bước giải)', state: [1, 2, 3, 4, 5, 6, 7, 0, 8] },
      { id: 'medium4', name: 'Trung bình (4 bước giải)', state: [1, 2, 3, 0, 4, 6, 7, 5, 8] },
      { id: 'medium6', name: 'Nâng cao (6 bước giải)', state: [0, 1, 3, 4, 2, 6, 7, 5, 8] }
    ],
    formatState: (state) => `(${state.join(', ')})`,
    stateToKey: (state) => state.join(','),
    isGoal: function(state) {
      for (let i = 0; i < 9; i++) {
        if (state[i] !== this.goalState[i]) return false;
      }
      return true;
    },
    expand: function(node) {
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

        if (parentState && val !== 0) {
          const prevZeroIdx = parentState.indexOf(0);
          if (idx === prevZeroIdx) tile.classList.add('moved');
        }

        if (val !== 0 && val === this.goalState[idx]) {
          tile.classList.add('correct');
        }

        tile.textContent = val !== 0 ? val : '';
        board.appendChild(tile);
      });

      container.appendChild(board);
    },
    shuffle: function(steps = 3) {
      let curr = [...this.goalState];
      for (let s = 0; s < steps; s++) {
        const dummyNode = new SearchNode(curr);
        const children = this.expand(dummyNode);
        const rand = children[Math.floor(Math.random() * children.length)];
        curr = [...rand.state];
      }
      return curr;
    }
  }

  /* 
   * GỢI Ý MỞ RỘNG SAU NÀY:
   * Khi bạn nghiên cứu thêm bài toán mới (ví dụ: máy hút bụi, đong nước...),
   * chỉ cần định nghĩa thêm vào đây:
   * 'vacuum': { id: 'vacuum', name: '...', defaultState: [...], ... }
   */
};

// Gắn vào window để dễ dàng mở rộng và kiểm thử
if (typeof window !== 'undefined') {
  window.PROBLEMS = PROBLEMS;
  window.runSearch = runSearch;
}

/* ========================================================
   TRÌNH ĐIỀU KHIỂN CHUNG (GENERIC CONTROLLER)
   ======================================================== */
let currentProblemId = '8puzzle';
let currentAlgorithm = 'BFS';
let currentState = [...PROBLEMS['8puzzle'].defaultState];
let traceSteps = [];
let currentStepIndex = 0;
let isPlaying = false;
let playTimer = null;
let stepDelay = 400; // ms

function getCurrentProblem() {
  return PROBLEMS[currentProblemId];
}

// Hàm tìm kiếm tổng quát áp dụng cho mọi bài toán
function runSearch(algo, startState, problem) {
  const initialNode = new SearchNode([...startState], null, 0, 'START');
  const frontier = [initialNode]; // BFS: shift/push, DFS: pop/push
  const explored = new Set();
  const frontierSet = new Set([problem.stateToKey(startState)]);

  const steps = [];
  let stepCounter = 0;
  let finalNode = null;
  const maxSteps = 1500;

  while (frontier.length > 0 && stepCounter < maxSteps) {
    const currentNode = (algo === 'BFS') ? frontier.shift() : frontier.pop();
    const currKey = problem.stateToKey(currentNode.state);
    frontierSet.delete(currKey);

    const goalReached = problem.isGoal(currentNode.state);

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

    const children = problem.expand(currentNode);
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
  let solutionPath = null;
  if (finalNode) {
    solutionPath = [];
    let curr = finalNode;
    while (curr !== null) {
      solutionPath.push({
        state: curr.state,
        action: curr.action,
        cost: curr.pathCost
      });
      curr = curr.parent;
    }
    solutionPath.reverse();
  }

  return {
    steps,
    solutionPath,
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

  // 1. Vẽ Node
  const container = document.getElementById('visualContainer');
  const parentState = s.node.parent ? s.node.parent.state : null;
  problem.renderVisual(s.node.state, container, s.action, parentState);

  document.getElementById('stateTupleText').textContent = problem.formatState(s.node.state);
  document.getElementById('nodeCostText').textContent = s.node.pathCost;
  document.getElementById('nodeDepthText').textContent = s.node.pathCost;
  document.getElementById('nodeActionText').textContent = s.action;

  // 2. Vẽ Frontier dạng List
  renderFrontierList(s.frontierSnapshot, currentAlgorithm, problem);

  // 3. Vẽ Endpoint dạng List
  renderEndpoint(window.latestSolutionPath, s.isGoal, s.step, problem);

  // 4. Chỉ báo tiến độ
  document.getElementById('stepProgressIndicator').textContent = `${index + 1} / ${traceSteps.length}`;

  // 5. Highlight hàng trong bảng
  document.querySelectorAll('#traceTableBody tr').forEach(r => r.classList.remove('active-row'));
  const activeRow = document.getElementById(`trace-step-${index}`);
  if (activeRow) {
    activeRow.classList.add('active-row');
    activeRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Cập nhật nút lùi/tiến
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

// Hiển thị Endpoint dạng List
function renderEndpoint(solutionPath, isGoalCurrent, currentStep, problem) {
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
        <span style="font-family: monospace;">${problem.formatState(p.state)}</span>
      </div>
      <div>
        <span class="list-action-tag" style="${isGoalStep ? 'background:#ecfdf5; color:#059669; font-weight:bold;' : ''}">
          ${p.action}
        </span>
      </div>
    `;

    item.onclick = () => {
      const container = document.getElementById('visualContainer');
      problem.renderVisual(p.state, container, p.action, null);
      document.getElementById('stateTupleText').textContent = problem.formatState(p.state);
      document.getElementById('nodeCostText').textContent = p.cost;
      document.getElementById('nodeActionText').textContent = p.action;
    };

    pathListEl.appendChild(item);
  });
}

// Hiển thị bảng vết từng bước
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
   SỰ KIỆN THAY ĐỔI COMBO BOX & ĐIỀU KHIỂN
   ======================================================== */

// Khởi chạy lại toàn bộ thuật toán
function initializeSearch() {
  pausePlayback();
  const problem = getCurrentProblem();

  const searchResult = runSearch(currentAlgorithm, currentState, problem);
  traceSteps = searchResult.steps;
  window.latestSolutionPath = searchResult.solutionPath;

  renderTraceTable(traceSteps, problem);
  applyStep(0);
}

// 1. Khi đổi bài toán từ Combo Box
function onProblemChange(problemId) {
  currentProblemId = problemId;
  const problem = getCurrentProblem();

  // Cập nhật phụ đề ứng dụng
  document.getElementById('appSubtitle').textContent = `${problem.name} — Thuật toán tìm kiếm BFS & DFS`;
  
  // Cập nhật danh sách Presets tương ứng trong Combo box
  populatePresets(problem);

  currentState = [...problem.defaultState];
  document.getElementById('customStateInput').value = problem.defaultState.join(', ');
  
  initializeSearch();
}

// 2. Khi đổi thuật toán từ Combo Box (Yêu cầu chính)
function onAlgorithmChange(algoName) {
  currentAlgorithm = algoName;
  const badge = document.getElementById('frontierTypeBadge');
  badge.textContent = (algoName === 'BFS') ? 'FIFO Queue' : 'LIFO Stack';
  initializeSearch();
}

// 3. Khi đổi trạng thái mẫu từ Combo Box
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

// Điền các option presets vào combo box
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

// Nhập mảng tự do
function setCustomState() {
  const problem = getCurrentProblem();
  const val = document.getElementById('customStateInput').value.trim();
  
  const parts = val.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
  if (parts.length !== 9) {
    alert('Vui lòng nhập đúng 9 chữ số từ 0 đến 8 cách nhau bởi dấu phẩy!');
    return;
  }
  currentState = parts;
  initializeSearch();
}

// Đổi đề / Xáo đề ngẫu nhiên
function shuffleCurrentProblem() {
  const problem = getCurrentProblem();
  currentState = problem.shuffle();
  document.getElementById('presetSelect').value = 'custom';
  document.getElementById('customInputBox').style.display = 'flex';
  document.getElementById('customStateInput').value = currentState.join(', ');
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
  let md = `| Step | Node State | Action | Explored | Goal |\n|---|---|---|---|---|\n`;
  traceSteps.forEach(s => {
    md += `| ${s.step} | ${problem.formatState(s.node.state)} | ${s.action} | ${s.exploredCount} | ${s.isGoal ? 'TRUE' : 'False'} |\n`;
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

// Khởi chạy
window.onload = function() {
  populatePresets(getCurrentProblem());
  initializeSearch();
};
