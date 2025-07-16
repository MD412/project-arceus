import sys
import pathlib
import importlib

# Ensure project root is on sys.path for imports like `import worker ...`
ROOT_DIR = pathlib.Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR)) 

# Alias 'config' to 'worker.config' for modules that expect top-level import structure
if 'config' not in sys.modules:
    try:
        sys.modules['config'] = importlib.import_module('worker.config')
    except ModuleNotFoundError:
        pass  # worker.config may not exist yet; tests depending on it will fail gracefully 