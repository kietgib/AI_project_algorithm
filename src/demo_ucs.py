import heapq
from itertools import count

class Node:
    def __init__(self, state, parent=None, action=None, path_cost=0):
        self.state = state
        self.parent = parent
        self.action = action
        self.path_cost = path_cost

def is_goal(node, goal_state):
    return node.state == goal_state

priority_order = count()

def create_queue():
    return []

def enqueue(frontier, node):
    heapq.heappush(
        frontier,
        (node.path_cost, next(priority_order), node)
    )

def dequeue(frontier):
    return heapq.heappop(frontier)[2]

def is_empty(frontier):
    return len(frontier) == 0

def trace_solution(node):
    path = []
    while node is not None:
        path.append(node)
        node = node.parent
    path.reverse()
    return path

class Problem:
    def __init__(self, initial_state, goal_state, expand_function):
        self.initial_state = initial_state
        self.goal_state = goal_state
        self.expand_function = expand_function

    def is_goal(self, node):
        return is_goal(node, self.goal_state)

    def expand(self, node):
        return self.expand_function(node)

def UCS(problem):
    initial_node = Node(problem.initial_state)
    frontier = create_queue()
    enqueue(frontier, initial_node)

    explored = set()
    best_cost = {initial_node.state: 0}

    while not is_empty(frontier):
        current_node = dequeue(frontier)

        if current_node.path_cost != best_cost.get(current_node.state):
            continue

        if problem.is_goal(current_node):
            return trace_solution(current_node)

        explored.add(current_node.state)
        children = problem.expand(current_node)

        for child in children:
            child_state = child.state
            new_cost = child.path_cost

            if child_state not in explored:
                if child_state not in best_cost or new_cost < best_cost[child_state]:
                    best_cost[child_state] = new_cost
                    enqueue(frontier, child)

    return None

def expand_8puzzle(node):
    children = []
    state = node.state
    zero_index = state.index(0)
    row = zero_index // 3
    col = zero_index % 3

    actions = [
        ("UP",    -1,  0, 1),
        ("DOWN",   1,  0, 1),
        ("LEFT",   0, -1, 2),
        ("RIGHT",  0,  1, 2)
    ]

    for action, dr, dc, action_cost in actions:
        new_row = row + dr
        new_col = col + dc

        if 0 <= new_row < 3 and 0 <= new_col < 3:
            new_index = new_row * 3 + new_col
            new_state = list(state)
            new_state[zero_index], new_state[new_index] = (
                new_state[new_index],
                new_state[zero_index]
            )

            child = Node(
                state=tuple(new_state),
                parent=node,
                action=action,
                path_cost=node.path_cost + action_cost
            )
            children.append(child)

    return children

def expand_vacuum(node):
    children = []
    position, room_A, room_B = node.state

    if position == "A" and room_A == "D":
        child_state = ("A", "C", room_B)
        children.append(
            Node(child_state, parent=node, action="SUCK", path_cost=node.path_cost + 2)
        )
    elif position == "B" and room_B == "D":
        child_state = ("B", room_A, "C")
        children.append(
            Node(child_state, parent=node, action="SUCK", path_cost=node.path_cost + 2)
        )

    if position == "A":
        child_state = ("B", room_A, room_B)
        children.append(
            Node(child_state, parent=node, action="RIGHT", path_cost=node.path_cost + 1)
        )
    elif position == "B":
        child_state = ("A", room_A, room_B)
        children.append(
            Node(child_state, parent=node, action="LEFT", path_cost=node.path_cost + 1)
        )

    return children

if __name__ == "__main__":
    print("=" * 60)
    print("1. UCS - BÀI TOÁN 8-PUZZLE")
    print("=" * 60)
    initial_8puzzle = (
        1, 3, 6,
        5, 0, 2,
        4, 7, 8
    )
    goal_8puzzle = (
        1, 2, 3,
        4, 5, 6,
        7, 8, 0
    )
    problem_8puzzle = Problem(initial_8puzzle, goal_8puzzle, expand_8puzzle)
    sol_8puzzle = UCS(problem_8puzzle)

    if sol_8puzzle:
        print("Number of moves:", len(sol_8puzzle) - 1)
        print("Total Path Cost:", sol_8puzzle[-1].path_cost)
        for i, node in enumerate(sol_8puzzle):
            print(f"\nStep {i}: Action = {node.action}, Cost = {node.path_cost}")
            for j in range(0, 9, 3):
                print(node.state[j:j+3])
    else:
        print("No solution found!")

    print("\n" + "=" * 60)
    print("2. UCS - BÀI TOÁN MÁY HÚT BỤI (VACUUM CLEANER)")
    print("=" * 60)
    vacuum_initial = ("A", "D", "D")
    vacuum_goal = ("B", "C", "C")
    problem_vacuum = Problem(vacuum_initial, vacuum_goal, expand_vacuum)
    sol_vacuum = UCS(problem_vacuum)

    if sol_vacuum:
        print("Number of actions:", len(sol_vacuum) - 1)
        print("Total Path Cost:", sol_vacuum[-1].path_cost)
        for i, node in enumerate(sol_vacuum):
            print(f"\nStep {i}: Action = {node.action}, Cost = {node.path_cost}")
            print("State:", node.state)
    else:
        print("No solution found!")
