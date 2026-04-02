"""
Complexity Analyzer: derives time and space complexity from code features.
"""

from .ast_analyzer import CodeFeatures


def detect_time_complexity(features: CodeFeatures) -> str:
    # Three or more nested loops
    if features.nested_loop_depth >= 3:
        return "O(n³)"

    # Two nested loops
    if features.nested_loop_depth == 2:
        return "O(n²)"

    # Binary search style (takes priority over single loop when specific vars present)
    if features.has_binary_search_style:
        return "O(log n)"

    # Sorting dominant
    if features.has_sorting and features.nested_loop_depth <= 1:
        return "O(n log n)"

    # Single loop (with or without dict lookup)
    if features.has_single_loop:
        return "O(n)"

    # No loops, no recursion
    if features.has_recursion:
        return "O(n)"

    return "O(1)"


def detect_space_complexity(features: CodeFeatures) -> str:
    # 2D matrix
    if features.has_2d_list:
        return "O(n²)"

    # Recursion uses call stack
    if features.has_recursion:
        return "O(n)"

    # Any auxiliary data structure
    if features.has_dict_or_set or features.has_list_creation:
        return "O(n)"

    return "O(1)"
