"""
Analyzer Service: orchestrates all analyzers and returns a unified result.
"""

import ast

from analyzers.ast_analyzer import analyze_ast
from analyzers.complexity_analyzer import detect_time_complexity, detect_space_complexity
from analyzers.pattern_analyzer import detect_pattern
from analyzers.mistake_analyzer import detect_mistakes
from analyzers.suggestion_engine import generate_suggestions


def run_analysis(code: str) -> dict:
    """
    Parse and analyze the submitted Python code.
    Raises SyntaxError if the code cannot be parsed.
    """
    try:
        ast.parse(code)
    except SyntaxError as exc:
        raise SyntaxError(f"Syntax Error: {exc.msg} (line {exc.lineno})") from exc

    features = analyze_ast(code)

    return {
        "time_complexity": detect_time_complexity(features),
        "space_complexity": detect_space_complexity(features),
        "pattern_detected": detect_pattern(features),
        "mistakes": detect_mistakes(features),
        "suggestions": generate_suggestions(features),
    }
