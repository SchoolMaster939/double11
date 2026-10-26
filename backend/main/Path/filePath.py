import sys
from pathlib import Path

def get_base_url() -> Path:
    if hasattr(sys, '_MEIPASS'):
        return Path(sys.executable).parent
    else:
        return Path(__file__).parent.parent.parent.parent