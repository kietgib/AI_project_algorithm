
from collections import deque
import time

class Node:
    def __init__(self, state, parent=None, path_cost=0, action="START"):
        self.state = state          
        self.parent = parent        
        self.path_cost = path_cost  
        self.action = action        

    def __repr__(self):
        return f"Node(state={self.state}, cost={self.path_cost}, action={self.action})"

def is_goal(node, goal_state):
    return node.state == goal_state

def create_queue():
    """Tạo hàng đợi cho BFS (FIFO)"""
    return deque()

def create_stack():
    """Tạo ngăn xếp cho DFS (LIFO)"""
    return []

def enqueue(frontier, node):
    """Thêm vào cuối hàng đợi/ngăn xếp"""
    frontier.append(node)

def dequeue(frontier):
    """Lấy phần tử đầu cho BFS (FIFO)"""
    return frontier.popleft()

def pop(frontier):
    """Lấy phần tử cuối cho DFS (LIFO)"""
    return frontier.pop()

def is_empty(frontier):
    return len(frontier) == 0

def expand(node):
    children = []
    state = node.state

    zero_index = state.index(0)
    row = zero_index // 3
    col = zero_index % 3

    actions = [
        (-1, 0, "UP"),
        (1, 0, "DOWN"),
        (0, -1, "LEFT"),
        (0, 1, "RIGHT")
    ]

    for dr, dc, action_name in actions:
        new_row = row + dr
        new_col = col + dc

        if 0 <= new_row < 3 and 0 <= new_col < 3:
            new_index = new_row * 3 + new_col

            new_state = list(state)
            new_state[zero_index], new_state[new_index] = (
                new_state[new_index],
                new_state[zero_index]
            )

            new_state = tuple(new_state)

            child = Node(
                state=new_state,
                parent=node,
                path_cost=node.path_cost + 1,
                action=action_name
            )

            children.append(child)

    return children

def trace_solution(node):
    path = []
    while node is not None:
        path.append(node)
        node = node.parent
    path.reverse()
    return path

class Problem:
    def __init__(self, initial_state, goal_state):
        self.initial_state = initial_state
        self.goal_state = goal_state

    def is_goal(self, node):
        return is_goal(node, self.goal_state)

    def expand(self, node):
        return expand(node)

def BFS(problem):
    initial_node = Node(problem.initial_state)
    frontier = create_queue()
    enqueue(frontier, initial_node)
    frontier_set = {initial_node.state}
    explored = set()
    trace = []
    step = 0

    while not is_empty(frontier):
        current_node = dequeue(frontier)
        frontier_set.remove(current_node.state)

        trace.append({
            "step": step,
            "node": current_node.state,
            "action": current_node.action,
            "frontier": [n.state for n in frontier],
            "explored_count": len(explored),
            "is_goal": problem.is_goal(current_node)
        })

        if problem.is_goal(current_node):
            return trace_solution(current_node), trace

        explored.add(current_node.state)

        children = problem.expand(current_node)

        for child in children:
            if child.state not in explored and child.state not in frontier_set:
                enqueue(frontier, child)
                frontier_set.add(child.state)

        step += 1

    return None, trace

def DFS(problem, max_depth=50):
    initial_node = Node(problem.initial_state)
    frontier = create_stack()
    enqueue(frontier, initial_node)
    frontier_set = {initial_node.state}
    explored = set()
    trace = []
    step = 0

    while not is_empty(frontier):
        current_node = pop(frontier)
        frontier_set.remove(current_node.state)

        trace.append({
            "step": step,
            "node": current_node.state,
            "action": current_node.action,
            "frontier": [n.state for n in frontier],
            "explored_count": len(explored),
            "is_goal": problem.is_goal(current_node)
        })

        if problem.is_goal(current_node):
            return trace_solution(current_node), trace

        explored.add(current_node.state)

        children = problem.expand(current_node)
        children.reverse()

        for child in children:
            if child.state not in explored and child.state not in frontier_set:
                enqueue(frontier, child)
                frontier_set.add(child.state)

        step += 1

    return None, trace

def print_board(state):
    for i in range(0, 9, 3):
        row = state[i:i+3]
        print("  " + " ".join(f"[{x if x != 0 else ' '}]" for x in row))

def display_results(algo_name, solution, trace):
    print("=" * 60)
    print(f"  KẾT QUẢ THUẬT TOÁN: {algo_name}")
    print("=" * 60)

    if solution:
        print(f"\n[+] TÌM THẤY ĐÍCH THÀNH CÔNG!")
        print(f"[*] Số bước di chuyển (Moves): {len(solution) - 1}")
        print(f"[*] Tổng số Node đã duyệt (Steps): {len(trace)}")

        print("\n--- ĐƯỜNG ĐI LỜI GIẢI (SOLUTION PATH) ---")
        for i, node in enumerate(solution):
            print(f"\nBước {i} (Hành động: {node.action}, Chi phí: {node.path_cost}):")
            print_board(node.state)

        print("\n--- BẢNG VẾT DUYỆT TỪNG STEP (SEARCH TABLE) ---")
        print(f"{'Step':<6} | {'Node (Trạng thái)':<26} | {'Hành động':<10} | {'|Frontier|':<10} | {'Đích?'}")
        print("-" * 65)
        for t in trace[:15]: # in tối đa 15 bước mẫu
            print(f"{t['step']:<6} | {str(t['node']):<26} | {t['action']:<10} | {len(t['frontier']):<10} | {t['is_goal']}")
        if len(trace) > 15:
            print(f"... (còn {len(trace) - 15} bước tiếp theo)")
    else:
        print("\n[-] KHÔNG TÌM THẤY LỜI GIẢI!")


if __name__ == "__main__":
    print("=========================================================")
    print("  TRẦN GIA KIỆT - 24110103")
    print("  DEMO THUẬT TOÁN")
    print("=========================================================")

    initial_state = (1, 2, 3,
                     4, 0, 6,
                     7, 5, 8)

    goal_state = (1, 2, 3,
                  4, 5, 6,
                  7, 8, 0)

    problem = Problem(initial_state=initial_state, goal_state=goal_state)

    print("\nTrạng thái bắt đầu:")
    print_board(initial_state)

    print("\nTrạng thái đích cần đạt:")
    print_board(goal_state)

    # 1. Chạy BFS
    bfs_solution, bfs_trace = BFS(problem)
    display_results("BFS (Breadth-First Search)", bfs_solution, bfs_trace)

    # 2. Chạy DFS
    dfs_solution, dfs_trace = DFS(problem)
    display_results("DFS (Depth-First Search)", dfs_solution, dfs_trace)
