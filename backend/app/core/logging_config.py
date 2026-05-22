import logging
import logging.handlers
from pathlib import Path

LOGS_DIR = Path(__file__).resolve().parents[3] / "logs"
LOGS_DIR.mkdir(exist_ok=True)

ALL_LOG_FILE   = LOGS_DIR / "app.log"
ERROR_LOG_FILE = LOGS_DIR / "errors.log"

# ── Formatters ────────────────────────────────────────────────────────────────

_ALL_FMT = logging.Formatter(
    fmt="%(asctime)s.%(msecs)03d | %(levelname)-8s | %(name)s:%(lineno)d - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

class _ErrorFormatter(logging.Formatter):
    """Wraps each error in a clear visual block so it stands out in errors.log."""
    SEP = "═" * 72

    def format(self, record: logging.LogRecord) -> str:
        base = super().format(record)
        return f"\n{self.SEP}\n{base}\n{self.SEP}"

_ERROR_FMT = _ErrorFormatter(
    fmt="%(asctime)s | %(levelname)s | %(name)s:%(lineno)d\n%(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# ── Handlers ─────────────────────────────────────────────────────────────────

def _make_rotating(path: Path, level: int, formatter: logging.Formatter) -> logging.Handler:
    handler = logging.handlers.RotatingFileHandler(
        path,
        maxBytes=5 * 1024 * 1024,   # 5 MB per file
        backupCount=5,               # keep last 5 rotated files
        encoding="utf-8",
    )
    handler.setLevel(level)
    handler.setFormatter(formatter)
    return handler


def setup_logging() -> None:
    """Call once at app startup to configure root logger with both file handlers."""
    root = logging.getLogger()
    root.setLevel(logging.INFO)

    # Avoid duplicate handlers if setup_logging() is called more than once
    if root.handlers:
        return

    # Console (INFO+)
    console = logging.StreamHandler()
    console.setLevel(logging.INFO)
    console.setFormatter(_ALL_FMT)

    # app.log — everything INFO and above
    all_handler = _make_rotating(ALL_LOG_FILE, logging.INFO, _ALL_FMT)

    # errors.log — only ERROR and above, wrapped in visual blocks
    error_handler = _make_rotating(ERROR_LOG_FILE, logging.ERROR, _ERROR_FMT)

    root.addHandler(console)
    root.addHandler(all_handler)
    root.addHandler(error_handler)

    logging.getLogger("uvicorn.access").propagate = False  # skip noisy request lines from errors.log
