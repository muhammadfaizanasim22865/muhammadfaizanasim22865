"""
AST Analyzer: walks the AST and extracts structural features of the code.
"""

import ast
from dataclasses import dataclass, field


@dataclass
class CodeFeatures:
    has_single_loop: bool = False
    nested_loop_depth: int = 0          # max nesting depth of loops
    has_recursion: bool = False
    has_dict_or_set: bool = False
    has_sorting: bool = False
    has_binary_search_style: bool = False  # while low <= high pattern
    has_2d_list: bool = False
    has_list_creation: bool = False
    has_queue_or_deque: bool = False
    has_stack_pop: bool = False          # list.pop() without arg or pop(0)
    function_names: list[str] = field(default_factory=list)
    variable_names: set[str] = field(default_factory=set)
    loop_count: int = 0
    has_base_case_in_recursive_fn: bool = False
    multiple_traversals: bool = False    # same iterable used in multiple for loops


def _max_loop_depth(node: ast.AST, current_depth: int = 0) -> int:
    """Recursively compute the maximum loop nesting depth."""
    if isinstance(node, (ast.For, ast.While)):
        current_depth += 1
        max_child = current_depth
        for child in ast.iter_child_nodes(node):
            max_child = max(max_child, _max_loop_depth(child, current_depth))
        return max_child
    else:
        max_child = current_depth
        for child in ast.iter_child_nodes(node):
            max_child = max(max_child, _max_loop_depth(child, current_depth))
        return max_child


def _has_binary_search_while(tree: ast.AST) -> bool:
    """Detect 'while low <= high' style patterns."""
    for node in ast.walk(tree):
        if not isinstance(node, ast.While):
            continue
        test = node.test
        # while low <= high  →  Compare(left=Name('low'), ops=[LtE], comparators=[Name('high')])
        if isinstance(test, ast.Compare):
            names_in_test: set[str] = set()
            for n in ast.walk(test):
                if isinstance(n, ast.Name):
                    names_in_test.add(n.id)
            if {"low", "high"}.issubset(names_in_test):
                return True
            if {"left", "right"}.issubset(names_in_test) and any(
                isinstance(op, (ast.LtE, ast.Lt)) for op in test.ops
            ):
                return True
        # Also accept BoolOp wrapping Compare
        if isinstance(test, ast.BoolOp):
            for value in ast.walk(test):
                if isinstance(value, ast.Compare):
                    names_in_test = set()
                    for n in ast.walk(value):
                        if isinstance(n, ast.Name):
                            names_in_test.add(n.id)
                    if {"low", "high"}.issubset(names_in_test):
                        return True
    return False


def _check_recursion(tree: ast.AST) -> tuple[bool, bool]:
    """
    Returns (has_recursion, has_base_case).
    has_base_case is True if there is a return inside an if block in the recursive function.
    """
    for node in ast.walk(tree):
        if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue
        fn_name = node.name
        # Check if function calls itself
        calls_itself = False
        for child in ast.walk(node):
            if isinstance(child, ast.Call):
                if isinstance(child.func, ast.Name) and child.func.id == fn_name:
                    calls_itself = True
                    break
        if not calls_itself:
            continue
        # Check for base case: an if/elif/else that contains a return
        has_base = False
        for child in ast.walk(node):
            if isinstance(child, ast.If):
                for stmt in ast.walk(child):
                    if isinstance(stmt, ast.Return):
                        has_base = True
                        break
            if has_base:
                break
        return True, has_base
    return False, False


def _collect_iterable_names(loop: ast.For) -> str | None:
    """Return the string name of the iterable being iterated, if it's a simple Name."""
    if isinstance(loop.iter, ast.Name):
        return loop.iter.id
    # range(len(arr)) → we want 'arr'
    if (
        isinstance(loop.iter, ast.Call)
        and isinstance(loop.iter.func, ast.Name)
        and loop.iter.func.id == "range"
        and loop.iter.args
    ):
        arg = loop.iter.args[0]
        if isinstance(arg, ast.Call) and isinstance(arg.func, ast.Name) and arg.func.id == "len":
            if arg.args and isinstance(arg.args[0], ast.Name):
                return arg.args[0].id
    return None


def _detect_multiple_traversals(tree: ast.AST) -> bool:
    """Return True if the same iterable is traversed in multiple separate for loops."""
    iterable_counts: dict[str, int] = {}
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.Module)):
            for stmt in ast.walk(node):
                if isinstance(stmt, ast.For):
                    name = _collect_iterable_names(stmt)
                    if name:
                        iterable_counts[name] = iterable_counts.get(name, 0) + 1
    return any(count >= 2 for count in iterable_counts.values())


def analyze_ast(code: str) -> CodeFeatures:
    """Parse code and extract features."""
    tree = ast.parse(code)
    features = CodeFeatures()

    # Collect variable/function names
    for node in ast.walk(tree):
        if isinstance(node, ast.Name):
            features.variable_names.add(node.id)
        elif isinstance(node, ast.arg):
            features.variable_names.add(node.arg)
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            features.function_names.append(node.name)

    # Loop analysis
    loop_nodes = [n for n in ast.walk(tree) if isinstance(n, (ast.For, ast.While))]
    features.loop_count = len(loop_nodes)
    features.has_single_loop = features.loop_count >= 1

    max_depth = _max_loop_depth(tree)
    features.nested_loop_depth = max_depth

    # Dict / set
    for node in ast.walk(tree):
        if isinstance(node, (ast.Dict, ast.Set, ast.DictComp, ast.SetComp)):
            features.has_dict_or_set = True
            break
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in {"dict", "set", "defaultdict", "Counter"}:
                features.has_dict_or_set = True
                break
            if isinstance(node.func, ast.Attribute) and node.func.attr in {"get", "setdefault", "items", "keys", "values"}:
                features.has_dict_or_set = True

    # Sorting
    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id == "sorted":
                features.has_sorting = True
                break
            if isinstance(node.func, ast.Attribute) and node.func.attr == "sort":
                features.has_sorting = True
                break

    # Binary search pattern
    features.has_binary_search_style = _has_binary_search_while(tree)

    # 2D list / matrix
    for node in ast.walk(tree):
        if isinstance(node, ast.ListComp):
            for gen in node.generators:
                if isinstance(gen.iter, ast.ListComp):
                    features.has_2d_list = True
                    break
        if isinstance(node, ast.List):
            for elt in node.elts:
                if isinstance(elt, ast.List):
                    features.has_2d_list = True
                    break

    # List creation that grows dynamically (append inside loop, list comprehension, or list() call)
    for node in ast.walk(tree):
        if isinstance(node, ast.ListComp):
            features.has_list_creation = True
            break
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "list":
            features.has_list_creation = True
            break
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
            if node.func.attr == "append":
                features.has_list_creation = True
                break

    # Queue / deque
    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Attribute) and node.func.attr == "deque":
                features.has_queue_or_deque = True
                break
            if isinstance(node.func, ast.Name) and node.func.id == "deque":
                features.has_queue_or_deque = True
                break
            # list used as queue: pop(0) or append
            if isinstance(node.func, ast.Attribute):
                if node.func.attr == "pop":
                    if node.args and isinstance(node.args[0], ast.Constant) and node.args[0].value == 0:
                        features.has_queue_or_deque = True

    # Stack pop (pop without args)
    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Attribute) and node.func.attr == "pop":
                if not node.args:
                    features.has_stack_pop = True
                    break

    # Recursion
    features.has_recursion, features.has_base_case_in_recursive_fn = _check_recursion(tree)

    # Multiple traversals
    features.multiple_traversals = _detect_multiple_traversals(tree)

    return features
