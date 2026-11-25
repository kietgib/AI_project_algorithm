/**
 * TRẦN GIA KIỆT - 24110103
 * BÀI TOÁN 8-PUZZLE - MÔ PHỎNG THUẬT TOÁN TÌM KIẾM BFS VÀ DFS
 * Đầy đủ tính năng: Node, Frontier (List), Endpoint (List), Trace Table (bắt đầu từ Step 1)
 * Chạy liên tục cho đến khi tìm thấy Đích (TRUE) - Tự nhập trạng thái linh hoạt
 */

// ==========================================
// CẤU TRÚC DỮ LIỆU NODE
// ==========================================
class SearchNode {
  constructor(state, parent = null, pathCost = 0, action = 'START') {
    this.state = state;
    this.parent = parent;
    this.pathCost = pathCost; // Chi phí đường đi: mỗi bước di chuyển tăng đúng 1
    this.action = action;
  }
}

// ==========================================
// ĐỊNH NGHĨA BÀI TOÁN (8-PUZZLE)
// ==========================================
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

    expand: function(node) {
      const children = [];
      const state = node.state;
      const zeroIdx = state.indexOf(0);
      const row = Math.floor(zeroIdx / 3);
      const col = zeroIdx % 3;

      // Thứ tự mở rộng chuẩn theo thứ tự: UP, DOWN, LEFT, RIGHT
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

          children.push(new SearchNode(
            nextState,
            node,
            node.pathCost + 1, // Chi phí đường đi tăng chính xác 1 bước
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
    }
  }
};

if (typeof window !== 'undefined') {
  window.PROBLEMS = PROBLEMS;
}

let currentProblemId = '8puzzle';
let currentAlgorithm = 'BFS';
let currentState = [...PROBLEMS['8puzzle'].defaultState];

let traceSteps = [];          
let solutionPath = [];        

let currentStepIndex = 0;
let isPlaying = false;
let playTimer = null;
let stepDelay = 400; // ms

function getCurrentProblem() {
  return PROBLEMS[currentProblemId];
}

/* ========================================================
   THUẬT TOÁN TÌM KIẾM BFS VÀ DFS
   - Chạy đến khi tìm thấy đích (goalReached = true)
   - Tối ưu hàng đợi BFS với con trỏ head O(1)
   - Tối ưu bộ nhớ Frontier Snapshot để chạy mượt cả trên hàng vạn bước
   ======================================================== */
function runSearch(algo, startState, problem) {
  const initialNode = new SearchNode([...startState], null, 0, 'START');
  let frontier = [initialNode];
  let head = 0; // Con trỏ hàng đợi O(1) cho BFS
  const explored = new Set();
  const frontierSet = new Set([problem.stateToKey(startState)]);

  const steps = [];
  let stepCounter = 1; // Step bắt đầu tính từ 1 để dễ đếm
  let finalNode = null;

  // Giới hạn an toàn tối đa cho không gian bài toán 8-puzzle (tối đa 181,440 trạng thái)
  const MAX_SPACE_SAFETY = 200000;

  while (head < frontier.length && steps.length < MAX_SPACE_SAFETY) {
    // BFS: lấy từ đầu hàng đợi (O(1) bằng con trỏ head)
    // DFS: lấy từ đỉnh ngăn xếp (pop O(1))
    const currentNode = (algo === 'BFS') ? frontier[head++] : frontier.pop();
    const currKey = problem.stateToKey(currentNode.state);
    frontierSet.delete(currKey);

    // Dọn dẹp mảng frontier của BFS theo đợt để giải phóng bộ nhớ
    if (algo === 'BFS' && head > 2000) {
      frontier = frontier.slice(head);
      head = 0;
    }

    const goalReached = problem.isGoal(currentNode.state);
    const fCount = frontier.length - head;

    // Chỉ lưu sample chi tiết cho 200 bước đầu hoặc bước tìm thấy đích
    // Điều này giúp trình duyệt chạy cực nhanh và nhẹ ngay cả với 100,000 bước
    const sampleFrontier = (stepCounter <= 200 || goalReached)
      ? (algo === 'BFS' 
          ? frontier.slice(head, head + 30).map(n => ({ state: n.state, action: n.action, cost: n.pathCost }))
          : frontier.slice(-30).map(n => ({ state: n.state, action: n.action, cost: n.pathCost })))
      : [];

    steps.push({
      step: stepCounter,
      node: currentNode,
      action: currentNode.action,
      cost: currentNode.pathCost,
      isGoal: goalReached,
      frontierSnapshot: sampleFrontier,
      frontierCount: fCount,
      exploredCount: explored.size,
      parentState: currentNode.parent ? currentNode.parent.state : null
    });

    // Dừng ngay khi tìm thấy ĐÍCH (True)
    if (goalReached) {
      finalNode = currentNode;
      break;
    }

    explored.add(currKey);

    // Sinh các node con theo thứ tự: UP, DOWN, LEFT, RIGHT
    const children = problem.expand(currentNode);

    // Đối với DFS (LIFO Stack), đảo ngược danh sách con khi push vào Stack
    // để khi pop() phần tử lấy ra trước tiên vẫn theo đúng thứ tự UP, DOWN, LEFT, RIGHT
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

  // Truy vết lời giải (Solution Path)
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

if (typeof window !== 'undefined') {
  window.runSearch = runSearch;
}

// Áp dụng trạng thái tại bước index (0-based trong mảng traceSteps)
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
  const fCount = s.frontierCount !== undefined ? s.frontierCount : s.frontierSnapshot.length;
  renderFrontierList(s.frontierSnapshot, fCount, currentAlgorithm, problem);

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
function renderFrontierList(frontierSnapshot, totalCount, algo, problem) {
  const listEl = document.getElementById('frontierList');
  const countBadge = document.getElementById('frontierCountBadge');

  const actualCount = (totalCount !== undefined) ? totalCount : frontierSnapshot.length;
  countBadge.textContent = `${actualCount} nodes`;
  listEl.innerHTML = '';

  if (actualCount === 0 || frontierSnapshot.length === 0) {
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

  if (actualCount > frontierSnapshot.length) {
    const moreNotice = document.createElement('div');
    moreNotice.style.cssText = 'color: #64748b; font-size: 0.72rem; text-align: center; padding: 6px; font-style: italic;';
    moreNotice.textContent = `... còn ${actualCount - frontierSnapshot.length} nodes nữa trong frontier ...`;
    listEl.appendChild(moreNotice);
  }
}

// Hiển thị Endpoint & Danh sách đường đi lời giải dạng List
function renderEndpoint(solPath, isGoalCurrent, currentStep, problem) {
  const statusEl = document.getElementById('endpointStatus');
  const pathListEl = document.getElementById('solutionPathList');
  const pathCountBadge = document.getElementById('solutionCountBadge');

  if (isGoalCurrent) {
    statusEl.className = 'endpoint-status status-found';
    statusEl.style.background = '';
    statusEl.style.color = '';
    statusEl.style.borderColor = '';
    statusEl.innerHTML = `<span>✓ ĐÃ TÌM THẤY ĐÍCH (TRUE)!</span> <span>Step ${currentStep}</span>`;
  } else if (!solPath && currentStepIndex === traceSteps.length - 1 && traceSteps.length > 0) {
    statusEl.className = 'endpoint-status';
    statusEl.style.background = '#fef2f2';
    statusEl.style.color = '#dc2626';
    statusEl.style.borderColor = '#fecaca';
    statusEl.innerHTML = `<span>✕ KHÔNG TÌM THẤY ĐÍCH (VÔ NGHIỆM)</span> <span>Duyệt ${traceSteps.length} nodes</span>`;
  } else {
    statusEl.className = 'endpoint-status status-searching';
    statusEl.style.background = '';
    statusEl.style.color = '';
    statusEl.style.borderColor = '';
    statusEl.innerHTML = `<span>⏳ Đang duyệt tìm kiếm...</span> <span>Step ${currentStep}</span>`;
  }

  pathListEl.innerHTML = '';

  if (!solPath || solPath.length === 0) {
    pathCountBadge.textContent = '0 bước';
    pathListEl.innerHTML = `<div style="color: var(--text-light); text-align: center; padding: 2rem 0; font-size: 0.8rem;">${!solPath && traceSteps.length > 0 ? 'Không có đường đi đến đích' : 'Đang tìm đường đi...'}</div>`;
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

  const fragment = document.createDocumentFragment();
  const MAX_RENDER_ROWS = 600;
  const isLarge = steps.length > MAX_RENDER_ROWS;
  const headCount = 400;
  const tailCount = 200;

  const createRow = (s, idx) => {
    const tr = document.createElement('tr');
    tr.id = `trace-step-${idx}`;
    if (s.isGoal) tr.classList.add('goal-row');

    const fCount = s.frontierCount !== undefined ? s.frontierCount : s.frontierSnapshot.length;
    const frontierBrief = fCount > 0 ? `[${fCount} nodes]` : '[]';

    tr.innerHTML = `
      <td><strong>${s.step}</strong></td>
      <td style="color: var(--primary); font-weight: 600;">${problem.formatState(s.node.state)}</td>
      <td><span class="list-action-tag">${s.action}</span></td>
      <td><strong>${s.cost}</strong></td>
      <td>${frontierBrief}</td>
      <td>${s.exploredCount} nodes</td>
      <td>${s.isGoal ? '<span style="color: #059669; font-weight: 800;">✓ ĐÍCH (TRUE)</span>' : '<span style="color: #94a3b8;">False</span>'}</td>
    `;

    tr.onclick = () => {
      pausePlayback();
      applyStep(idx);
    };
    return tr;
  };

  if (!isLarge) {
    steps.forEach((s, idx) => {
      fragment.appendChild(createRow(s, idx));
    });
  } else {
    for (let i = 0; i < headCount; i++) {
      fragment.appendChild(createRow(steps[i], i));
    }
    const omitTr = document.createElement('tr');
    omitTr.className = 'table-omitted-row';
    omitTr.innerHTML = `
      <td colspan="7" style="text-align: center; color: #64748b; font-style: italic; background: #f8fafc; padding: 10px; font-size: 0.8rem;">
        ... Đã ẩn ${steps.length - headCount - tailCount} bước trung gian để giao diện chạy siêu mượt (Tổng số bước: ${steps.length} steps) ...
      </td>
    `;
    fragment.appendChild(omitTr);
    for (let i = steps.length - tailCount; i < steps.length; i++) {
      fragment.appendChild(createRow(steps[i], i));
    }
  }

  tbody.appendChild(fragment);
}

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
    document.getElementById('customStateInput').focus();
    // Tự động chạy ngay trạng thái đang có trong ô nhập
    setCustomState();
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

// Trích xuất các số từ chuỗi nhập vào (chấp nhận mọi định dạng: dấu phẩy, khoảng trắng, ngoặc đơn/vuông)
function parseStateInput(str) {
  if (!str) return null;
  const matches = str.match(/\d+/g);
  if (!matches) return null;
  return matches.map(Number);
}

// Đếm số nghịch thế để kiểm tra khả năng giải của 8-puzzle
function countInversions(arr) {
  const nums = arr.filter(x => x !== 0);
  let inv = 0;
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] > nums[j]) inv++;
    }
  }
  return inv;
}

// Tự nhập mảng trạng thái
function setCustomState() {
  const inputEl = document.getElementById('customStateInput');
  const val = inputEl.value.trim();
  const parts = parseStateInput(val);

  if (!parts || parts.length !== 9) {
    alert('Vui lòng nhập đủ 9 số từ 0 đến 8!\n(Có thể nhập dạng: 1, 2, 3, 4, 0, 6, 7, 5, 8 hoặc 1 2 3 4 0 6 7 5 8)');
    return;
  }

  const setNums = new Set(parts);
  if (setNums.size !== 9 || ![0, 1, 2, 3, 4, 5, 6, 7, 8].every(k => setNums.has(k))) {
    alert('Trạng thái phải gồm đủ 9 chữ số từ 0 đến 8 không trùng lặp!');
    return;
  }

  // Chuẩn hóa định dạng hiển thị trong ô input
  inputEl.value = parts.join(', ');

  // Kiểm tra tính giải được (số nghịch thế lẻ = vô nghiệm trong 8-puzzle)
  const inv = countInversions(parts);
  if (inv % 2 !== 0) {
    const autoFix = confirm(
      `Lưu ý: Trạng thái này có số nghịch thế lẻ (${inv}), theo toán học sẽ KHÔNG THỂ giải về đích (1, 2, 3, 4, 5, 6, 7, 8, 0).\n\n` +
      `Bạn có muốn hệ thống tự động hoán đổi 2 ô để thành trạng thái có lời giải không?\n` +
      `- Bấm OK: Tự động đổi thành trạng thái giải được.\n` +
      `- Bấm Hủy (Cancel): Vẫn giữ nguyên để thử nghiệm tìm kiếm không có nghiệm.`
    );
    if (autoFix) {
      // Đổi chỗ 2 số khác 0 đầu tiên để đảo tính chẵn lẻ của số nghịch thế
      const idx1 = parts.findIndex(x => x !== 0);
      const idx2 = parts.findIndex((x, i) => x !== 0 && i > idx1);
      const temp = parts[idx1];
      parts[idx1] = parts[idx2];
      parts[idx2] = temp;
      inputEl.value = parts.join(', ');
    }
  }

  currentState = parts;
  initializeSearch();
}

// Tự động tạo một trạng thái ngẫu nhiên chắc chắn giải được (bằng cách xáo ngẫu nhiên từ trạng thái đích)
function generateRandomSolvable() {
  const problem = getCurrentProblem();
  let state = [...problem.goalState];
  const moves = [
    [-1, 0], [1, 0], [0, -1], [0, 1]
  ];
  let lastMove = null;
  const numSteps = 15;

  for (let s = 0; s < numSteps; s++) {
    const zero = state.indexOf(0);
    const r = Math.floor(zero / 3);
    const c = zero % 3;
    const validMoves = moves.filter(([dr, dc]) => {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= 3 || nc < 0 || nc >= 3) return false;
      if (lastMove && dr === -lastMove[0] && dc === -lastMove[1]) return false;
      return true;
    });
    const m = validMoves[Math.floor(Math.random() * validMoves.length)];
    const nr = r + m[0];
    const nc = c + m[1];
    const newIdx = nr * 3 + nc;
    state[zero] = state[newIdx];
    state[newIdx] = 0;
    lastMove = m;
  }

  const inputEl = document.getElementById('customStateInput');
  inputEl.value = state.join(', ');
  currentState = state;
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

// Nhảy ngay lập tức đến bước tìm thấy Đích (True)
function jumpToGoal() {
  pausePlayback();
  if (traceSteps.length > 0) {
    applyStep(traceSteps.length - 1);
  }
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

// Node.js module export hỗ trợ test
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SearchNode, PROBLEMS, runSearch, countInversions, parseStateInput };
}

// Khởi chạy trên trình duyệt
if (typeof window !== 'undefined') {
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

  window.onload = function() {
    populatePresets(getCurrentProblem());
    initializeSearch();
  };
}
