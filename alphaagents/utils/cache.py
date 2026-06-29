"""
utils/cache.py

Local JSON cache for all API calls.
Every tool checks this before hitting any external API.
Pattern: cache/{tool_name}/{md5_hash_of_params}.json

Usage:
    from alphaagents.utils.cache import get, set

    cached = get("tavily", {"query": "Reliance Q4"})
    if cached is None:
        result = call_api(...)
        set("tavily", {"query": "Reliance Q4"}, result)
"""

import hashlib
import json
from pathlib import Path
from typing import Any

# Always resolves to the /cache folder at the repo root
CACHE_DIR = Path(__file__).resolve().parent.parent.parent / "cache"


def _get_cache_path(tool_name: str, params: dict) -> Path:
    """Generate a deterministic file path for a given tool + params combo."""
    params_str = json.dumps(params, sort_keys=True)
    params_hash = hashlib.md5(params_str.encode()).hexdigest()
    tool_cache_dir = CACHE_DIR / tool_name
    tool_cache_dir.mkdir(parents=True, exist_ok=True)
    return tool_cache_dir / f"{params_hash}.json"


def get(tool_name: str, params: dict) -> Any | None:
    """
    Check if a cached result exists for this tool + params combination.
    Returns the cached data if found, None if not.
    """
    cache_path = _get_cache_path(tool_name, params)
    if cache_path.exists():
        print(f"[CACHE HIT] {tool_name} → {cache_path.name}")
        with open(cache_path, "r", encoding="utf-8") as f:
            return json.load(f)
    print(f"[CACHE MISS] {tool_name} → will call API")
    return None


def set(tool_name: str, params: dict, data: Any) -> None:
    """
    Save an API response to cache.
    data can be a dict or list — anything JSON-serializable.
    """
    cache_path = _get_cache_path(tool_name, params)
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"[CACHE SET] {tool_name} → {cache_path.name}")


def clear(tool_name: str | None = None) -> None:
    """
    Clear cache for a specific tool, or all cache if tool_name is None.
    Useful during testing.
    """
    if tool_name:
        tool_cache = CACHE_DIR / tool_name
        if tool_cache.exists():
            for f in tool_cache.glob("*.json"):
                f.unlink()
            print(f"[CACHE CLEARED] {tool_name}")
    else:
        for tool_dir in CACHE_DIR.iterdir():
            if tool_dir.is_dir():
                for f in tool_dir.glob("*.json"):
                    f.unlink()
        print("[CACHE CLEARED] all")