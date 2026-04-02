/**
 * In-browser Python DSA analysis using Pyodide.
 * Loads Pyodide from CDN lazily and runs the full AST-based analysis
 * entirely in the browser — no backend required.
 */

export interface AnalyzeResponse {
  time_complexity: string;
  space_complexity: string;
  pattern_detected: string;
  mistakes: string[];
  suggestions: string[];
}

export interface AnalyzeError {
  error: string;
}

// ---------------------------------------------------------------------------
// Python analysis script (embedded – mirrors the FastAPI backend logic)
// ---------------------------------------------------------------------------
const PYTHON_ANALYSIS_SCRIPT = `
import ast
import json

# ── AST Analyzer ────────────────────────────────────────────────────────────

class CodeFeatures:
    def __init__(self):
        self.has_single_loop = False
        self.nested_loop_depth = 0
        self.has_recursion = False
        self.has_dict_or_set = False
        self.has_sorting = False
        self.has_binary_search_style = False
        self.has_2d_list = False
        self.has_list_creation = False
        self.has_queue_or_deque = False
        self.has_stack_pop = False
        self.function_names = []
        self.variable_names = set()
        self.loop_count = 0
        self.has_base_case_in_recursive_fn = False
        self.multiple_traversals = False


def _max_loop_depth(node, current_depth=0):
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


def _has_binary_search_while(tree):
    for node in ast.walk(tree):
        if not isinstance(node, ast.While):
            continue
        test = node.test
        if isinstance(test, ast.Compare):
            names_in_test = set()
            for n in ast.walk(test):
                if isinstance(n, ast.Name):
                    names_in_test.add(n.id)
            if {"low", "high"}.issubset(names_in_test):
                return True
            if {"left", "right"}.issubset(names_in_test) and any(
                isinstance(op, (ast.LtE, ast.Lt)) for op in test.ops
            ):
                return True
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


def _check_recursion(tree):
    for node in ast.walk(tree):
        if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue
        fn_name = node.name
        calls_itself = False
        for child in ast.walk(node):
            if isinstance(child, ast.Call):
                if isinstance(child.func, ast.Name) and child.func.id == fn_name:
                    calls_itself = True
                    break
        if not calls_itself:
            continue
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


def _collect_iterable_names(loop):
    if isinstance(loop.iter, ast.Name):
        return loop.iter.id
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


def _detect_multiple_traversals(tree):
    iterable_counts = {}
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.Module)):
            for stmt in ast.walk(node):
                if isinstance(stmt, ast.For):
                    name = _collect_iterable_names(stmt)
                    if name:
                        iterable_counts[name] = iterable_counts.get(name, 0) + 1
    return any(count >= 2 for count in iterable_counts.values())


def analyze_ast(code):
    tree = ast.parse(code)
    features = CodeFeatures()

    for node in ast.walk(tree):
        if isinstance(node, ast.Name):
            features.variable_names.add(node.id)
        elif isinstance(node, ast.arg):
            features.variable_names.add(node.arg)
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            features.function_names.append(node.name)

    loop_nodes = [n for n in ast.walk(tree) if isinstance(n, (ast.For, ast.While))]
    features.loop_count = len(loop_nodes)
    features.has_single_loop = features.loop_count >= 1

    features.nested_loop_depth = _max_loop_depth(tree)

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

    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id == "sorted":
                features.has_sorting = True
                break
            if isinstance(node.func, ast.Attribute) and node.func.attr == "sort":
                features.has_sorting = True
                break

    features.has_binary_search_style = _has_binary_search_while(tree)

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

    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Attribute) and node.func.attr == "deque":
                features.has_queue_or_deque = True
                break
            if isinstance(node.func, ast.Name) and node.func.id == "deque":
                features.has_queue_or_deque = True
                break
            if isinstance(node.func, ast.Attribute):
                if node.func.attr == "pop":
                    if node.args and isinstance(node.args[0], ast.Constant) and node.args[0].value == 0:
                        features.has_queue_or_deque = True

    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Attribute) and node.func.attr == "pop":
                if not node.args:
                    features.has_stack_pop = True
                    break

    features.has_recursion, features.has_base_case_in_recursive_fn = _check_recursion(tree)
    features.multiple_traversals = _detect_multiple_traversals(tree)

    return features


# ── Complexity Analyzer ──────────────────────────────────────────────────────

def detect_time_complexity(features):
    if features.nested_loop_depth >= 3:
        return "O(n\u00b3)"
    if features.nested_loop_depth == 2:
        return "O(n\u00b2)"
    if features.has_binary_search_style:
        return "O(log n)"
    if features.has_sorting and features.nested_loop_depth <= 1:
        return "O(n log n)"
    if features.has_single_loop:
        return "O(n)"
    if features.has_recursion:
        return "O(n)"
    return "O(1)"


def detect_space_complexity(features):
    if features.has_2d_list:
        return "O(n\u00b2)"
    if features.has_recursion:
        return "O(n)"
    if features.has_dict_or_set or features.has_list_creation:
        return "O(n)"
    return "O(1)"


# ── Pattern Analyzer ─────────────────────────────────────────────────────────

def detect_pattern(features):
    var_names = features.variable_names

    has_left_right = {"left", "right"}.issubset(var_names)
    has_window_var = bool(
        {"window", "sum", "current", "curr", "count", "total", "window_sum"} & var_names
    )
    if has_left_right and has_window_var and features.has_single_loop:
        return "Sliding Window"

    if has_left_right:
        return "Two Pointers"

    bs_vars = {"low", "high", "mid"}
    if bs_vars.issubset(var_names) and features.has_binary_search_style:
        return "Binary Search"
    if {"left", "right", "mid"}.issubset(var_names) and features.has_binary_search_style:
        return "Binary Search"

    dfs_bfs_vars = {"stack", "queue", "visited"}
    if dfs_bfs_vars & var_names or features.has_queue_or_deque or features.has_stack_pop:
        return "DFS/BFS"

    if features.has_recursion:
        return "Recursion"

    if features.has_dict_or_set:
        return "Hashing"

    if features.nested_loop_depth >= 2:
        return "Brute Force"

    if features.has_single_loop:
        return "Linear Scan"

    return "Unknown"


# ── Mistake Analyzer ─────────────────────────────────────────────────────────

def detect_mistakes(features):
    mistakes = []

    if features.nested_loop_depth >= 2:
        mistakes.append(
            "Nested brute-force loop detected \u2014 this results in O(n\u00b2) or higher time complexity."
        )

    if features.has_recursion and not features.has_base_case_in_recursive_fn:
        mistakes.append(
            "Possible infinite recursion risk \u2014 no clear base-case return statement found."
        )

    if features.has_sorting and features.has_single_loop and features.nested_loop_depth <= 1:
        mistakes.append(
            "Sorting may be unnecessary \u2014 check whether the problem can be solved without sorting."
        )

    if features.multiple_traversals:
        mistakes.append(
            "Repeated traversal detected \u2014 the same data structure is iterated multiple times."
        )

    if features.nested_loop_depth >= 3:
        mistakes.append(
            "Triple-nested loop detected \u2014 O(n\u00b3) complexity is rarely acceptable for large inputs."
        )

    return mistakes


# ── Suggestion Engine ────────────────────────────────────────────────────────

def generate_suggestions(features):
    suggestions = []

    if features.nested_loop_depth >= 2 and not features.has_dict_or_set:
        suggestions.append(
            "Consider using a hash map (dict/set) to reduce nested-loop complexity from O(n\u00b2) to O(n)."
        )

    if features.multiple_traversals and features.has_single_loop:
        suggestions.append(
            "If processing contiguous subarrays, try the Sliding Window technique to traverse the data only once."
        )

    if features.has_sorting and features.has_single_loop and not features.has_binary_search_style:
        suggestions.append(
            "If you sort the array and then search, consider Binary Search (O(log n)) instead of a linear scan."
        )

    if features.has_recursion and not features.has_base_case_in_recursive_fn:
        suggestions.append(
            "Always define a clear base case in recursive functions to prevent stack overflow."
        )

    if features.nested_loop_depth >= 3:
        suggestions.append(
            "Triple-nested loops often signal a Dynamic Programming (DP) opportunity \u2014 consider memoization or tabulation."
        )

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


# ── Entry point ──────────────────────────────────────────────────────────────

def run_analysis(code):
    try:
        ast.parse(code)
    except SyntaxError as exc:
        raise SyntaxError(f"Syntax Error: {exc.msg} (line {exc.lineno})")

    features = analyze_ast(code)

    return json.dumps({
        "time_complexity": detect_time_complexity(features),
        "space_complexity": detect_space_complexity(features),
        "pattern_detected": detect_pattern(features),
        "mistakes": detect_mistakes(features),
        "suggestions": generate_suggestions(features),
    })
`;

// ---------------------------------------------------------------------------
// Pyodide loader (lazy, singleton)
// ---------------------------------------------------------------------------

const PYODIDE_VERSION = "0.27.0";
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<unknown>;
  globals: { set: (key: string, value: unknown) => void };
}

declare global {
  interface Window {
    loadPyodide: (options: { indexURL: string }) => Promise<PyodideInterface>;
  }
}

let _pyodideInstance: PyodideInterface | null = null;
let _pyodidePromise: Promise<PyodideInterface> | null = null;
let _scriptLoaded = false;

function loadPyodideScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (_scriptLoaded) {
      resolve();
      return;
    }
    const existing = document.getElementById("pyodide-script");
    if (existing) {
      // Script element already in DOM — check if loadPyodide is already available
      // (the load event may have fired before we attached this listener)
      if (typeof window.loadPyodide !== "undefined") {
        _scriptLoaded = true;
        resolve();
        return;
      }
      existing.addEventListener("load", () => { _scriptLoaded = true; resolve(); });
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.id = "pyodide-script";
    script.src = `${PYODIDE_INDEX_URL}pyodide.js`;
    script.onload = () => {
      _scriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Pyodide script from CDN"));
    document.head.appendChild(script);
  });
}

async function getPyodide(): Promise<PyodideInterface> {
  if (_pyodideInstance) return _pyodideInstance;
  if (_pyodidePromise) return _pyodidePromise;

  _pyodidePromise = (async () => {
    await loadPyodideScript();
    const pyodide = await window.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
    // Pre-load the analysis functions so subsequent calls are fast
    await pyodide.runPythonAsync(PYTHON_ANALYSIS_SCRIPT);
    _pyodideInstance = pyodide;
    return pyodide;
  })();

  return _pyodidePromise;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function isError(
  result: AnalyzeResponse | AnalyzeError
): result is AnalyzeError {
  return "error" in result;
}

export async function analyzeCode(
  code: string
): Promise<AnalyzeResponse | AnalyzeError> {
  try {
    const pyodide = await getPyodide();
    pyodide.globals.set("_user_code", code);
    const raw = await pyodide.runPythonAsync("run_analysis(_user_code)");
    return JSON.parse(raw as string) as AnalyzeResponse;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
}
