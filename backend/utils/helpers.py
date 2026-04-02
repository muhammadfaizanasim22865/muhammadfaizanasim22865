import ast
from typing import Any


def safe_parse(code: str) -> ast.Module:
    """Parse Python source code and return AST module, raising SyntaxError on failure."""
    return ast.parse(code)


def get_all_nodes(tree: ast.Module) -> list[Any]:
    """Return a flat list of all AST nodes in the tree."""
    return list(ast.walk(tree))


def get_variable_names(tree: ast.Module) -> set[str]:
    """Collect all variable/argument names used in the code."""
    names: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Name):
            names.add(node.id)
        elif isinstance(node, ast.arg):
            names.add(node.arg)
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            names.add(node.name)
    return names
