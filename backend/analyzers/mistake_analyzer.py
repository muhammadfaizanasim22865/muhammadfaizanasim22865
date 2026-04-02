"""
Mistake Detector: generates meaningful warnings based on code features.
"""

from .ast_analyzer import CodeFeatures


def detect_mistakes(features: CodeFeatures) -> list[str]:
    mistakes: list[str] = []

    # Nested brute-force
    if features.nested_loop_depth >= 2:
        mistakes.append(
            "Nested brute-force loop detected — this results in O(n²) or higher time complexity."
        )

    # Recursion without base case
    if features.has_recursion and not features.has_base_case_in_recursive_fn:
        mistakes.append(
            "Possible infinite recursion risk — no clear base-case return statement found."
        )

    # Sorting before linear scan (potential overkill)
    if features.has_sorting and features.has_single_loop and features.nested_loop_depth <= 1:
        mistakes.append(
            "Sorting may be unnecessary — check whether the problem can be solved without sorting."
        )

    # Multiple traversals of the same iterable
    if features.multiple_traversals:
        mistakes.append(
            "Repeated traversal detected — the same data structure is iterated multiple times."
        )

    # Very deep nesting (3+ levels)
    if features.nested_loop_depth >= 3:
        mistakes.append(
            "Triple-nested loop detected — O(n³) complexity is rarely acceptable for large inputs."
        )

    return mistakes
