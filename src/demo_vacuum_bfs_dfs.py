
initial_state = ("A", "D", "D")
goal_state = ("B", "C", "C")

def is_goal(state):
    return state == goal_state

def get_actions(state):
    position, room_A, room_B = state
    actions = []
    if position == "A":
        if room_A == "D":
            actions.append("Suck")
        actions.append("Right")
    elif position == "B":
        if room_B == "D":
            actions.append("Suck")
        actions.append("Left")
    return actions

def result(state, action):
    position, room_A, room_B = state
    if action == "Suck":
        if position == "A":
            room_A = "C"
        else:
            room_B = "C"
    elif action == "Right":
        position = "B"
    elif action == "Left":
        position = "A"
    return (position, room_A, room_B)

def display_state(state):
    return f"({state[0]}, {state[1]}, {state[2]})"

def BFS(start_state):
    frontier = [start_state]
    explored = []
    parent = {start_state: None}
    trace = []
    step = 0

    while frontier:
        node = frontier.pop(0)

        if is_goal(node):
            trace.append((
                step,
                display_state(node),
                [display_state(s) for s in frontier],
                [display_state(s) for s in explored]
            ))
            path = []
            curr = node
            while curr is not None:
                path.append(curr)
                curr = parent[curr]
            path.reverse()
            return path, trace

        explored.append(node)

        for action in get_actions(node):
            child = result(node, action)
            if child not in explored and child not in frontier:
                frontier.append(child)
                parent[child] = node

        trace.append((
            step,
            display_state(node),
            [display_state(s) for s in frontier],
            [display_state(s) for s in explored]
        ))
        step += 1

    return None, trace

def DFS(start_state):
    frontier = [start_state]
    explored = []
    parent = {start_state: None}
    trace = []
    step = 0

    while frontier:
        node = frontier.pop()

        if is_goal(node):
            trace.append((
                step,
                display_state(node),
                [display_state(s) for s in frontier],
                [display_state(s) for s in explored]
            ))
            path = []
            curr = node
            while curr is not None:
                path.append(curr)
                curr = parent[curr]
            path.reverse()
            return path, trace

        explored.append(node)

        for action in reversed(get_actions(node)):
            child = result(node, action)
            if child not in explored and child not in frontier:
                frontier.append(child)
                parent[child] = node

        trace.append((
            step,
            display_state(node),
            [display_state(s) for s in frontier],
            [display_state(s) for s in explored]
        ))
        step += 1

    return None, trace

def print_result(algo_name, path, trace):
    print("=" * 60)
    print(f"THUẬT TOÁN: {algo_name}")
    print("=" * 60)
    if path:
        print("TÌM THẤY ĐÍCH!")
        print("\nĐƯỜNG ĐI LỜI GIẢI:")
        for i, s in enumerate(path):
            print(f"Step {i}: {display_state(s)}")
        print("\nBẢNG TRACE TÌM KIẾM:")
        print(f"{'Step':<6} {'Node':<15} {'Frontier':<30} {'Explored'}")
        print("-" * 80)
        for row in trace:
            f_str = "[" + ", ".join(row[2]) + "]" if row[2] else "[]"
            e_str = "[" + ", ".join(row[3]) + "]" if row[3] else "[]"
            print(f"{row[0]:<6} {row[1]:<15} {f_str:<30} {e_str}")
    else:
        print("KHÔNG TÌM THẤY ĐÍCH!")
    print()

if __name__ == "__main__":
    bfs_path, bfs_trace = BFS(initial_state)
    print_result("BFS", bfs_path, bfs_trace)

    dfs_path, dfs_trace = DFS(initial_state)
    print_result("DFS", dfs_path, dfs_trace)
