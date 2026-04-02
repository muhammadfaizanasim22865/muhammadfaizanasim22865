"""
Suggestion Engine: provides educational, rule-based improvement suggestions.
"""

from .ast_analyzer import CodeFeatures


def generate_suggestions(features: CodeFeatures) -> list[str]:
    suggestions: list[str] = []

    # Nested loops → suggest hashing
    if features.nested_loop_depth >= 2 and not features.has_dict_or_set:
        suggestions.append(
            "Consider using a hash map (dict/set) to reduce nested-loop complexity from O(n²) to O(n)."
        )

    # Repeated traversals → suggest sliding window
    if features.multiple_traversals and features.has_single_loop:
        suggestions.append(
            "If processing contiguous subarrays, try the Sliding Window technique to traverse the data only once."
        )

    # Sorting followed by search → suggest binary search
    if features.has_sorting and features.has_single_loop and not features.has_binary_search_style:
        suggestions.append(
            "If you sort the array and then search, consider Binary Search (O(log n)) instead of a linear scan."
        )

    # Recursion without base case → remind about base case
    if features.has_recursion and not features.has_base_case_in_recursive_fn:
        suggestions.append(
            "Always define a clear base case in recursive functions to prevent stack overflow."
        )

    # Deep nesting → suggest divide-and-conquer or DP
    if features.nested_loop_depth >= 3:
        suggestions.append(
            "Triple-nested loops often signal a Dynamic Programming (DP) opportunity — consider memoization or tabulation."
        )

    # No suggestions generated for simple patterns
    if not suggestions:
        if features.has_single_loop and not features.nested_loop_depth >= 2:
            suggestions.append(
                "The current approach looks efficient. Ensure edge cases (empty input, single element) are handled."
            )
        elif features.has_binary_search_style:
            suggestions.append(
                "Binary Search is well-suited here. Verify loop termination conditions to avoid off-by-one errors."
            )
        else:
            suggestions.append(
                "Analyze edge cases and validate input constraints to make the solution more robust."
            )

    return suggestions
