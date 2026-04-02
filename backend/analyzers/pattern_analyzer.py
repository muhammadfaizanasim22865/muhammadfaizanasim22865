"""
Pattern Analyzer: detects common DSA patterns from code features.
"""

from .ast_analyzer import CodeFeatures


def detect_pattern(features: CodeFeatures) -> str:
    var_names = features.variable_names

    # Sliding Window (superset of Two Pointers – check first)
    has_left_right = {"left", "right"}.issubset(var_names)
    has_window_var = bool(
        {"window", "sum", "current", "curr", "count", "total", "window_sum"} & var_names
    )
    if has_left_right and has_window_var and features.has_single_loop:
        return "Sliding Window"

    # Two Pointers
    if has_left_right:
        return "Two Pointers"

    # Binary Search
    bs_vars = {"low", "high", "mid"}
    if bs_vars.issubset(var_names) and features.has_binary_search_style:
        return "Binary Search"
    # also accept left/right/mid binary search
    if {"left", "right", "mid"}.issubset(var_names) and features.has_binary_search_style:
        return "Binary Search"

    # DFS / BFS
    dfs_bfs_vars = {"stack", "queue", "visited"}
    if dfs_bfs_vars & var_names or features.has_queue_or_deque or features.has_stack_pop:
        return "DFS/BFS"

    # Recursion
    if features.has_recursion:
        return "Recursion"

    # Hashing
    if features.has_dict_or_set:
        return "Hashing"

    # Brute Force (nested loops without pattern)
    if features.nested_loop_depth >= 2:
        return "Brute Force"

    # Single loop
    if features.has_single_loop:
        return "Linear Scan"

    return "Unknown"
