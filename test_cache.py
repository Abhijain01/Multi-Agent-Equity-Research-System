"""
test_cache.py — run this manually to verify cache is working.
This is a scratch script, not a pytest test. Delete after verifying.

Run from repo root:
    python test_cache.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from alphaagents.utils import cache

print("=== Testing Cache Utility ===\n")

# Test 1: Cache miss (first call)
params = {"query": "Reliance Industries Q4 results", "max_results": 5}
result = cache.get("tavily", params)
print(f"Test 1 — Cache miss: {result}")  # Should print None
assert result is None, "Expected None on first call"

# Test 2: Cache set
fake_data = [
    {"title": "Reliance Q4 profit rises 12%", "url": "https://example.com/1", "content": "..."},
    {"title": "RIL announces dividend", "url": "https://example.com/2", "content": "..."},
]
cache.set("tavily", params, fake_data)
print("Test 2 — Cache set: done")

# Test 3: Cache hit (second call with same params)
result = cache.get("tavily", params)
print(f"Test 3 — Cache hit: got {len(result)} results")  # Should print 2
assert result == fake_data, "Cached data doesn't match original"
assert len(result) == 2

# Test 4: Different params = different cache entry
params2 = {"query": "HDFC Bank results", "max_results": 5}
result2 = cache.get("tavily", params2)
print(f"Test 4 — Different params, cache miss: {result2}")  # Should print None
assert result2 is None

# Test 5: Clear specific tool cache
cache.clear("tavily")
result = cache.get("tavily", params)
print(f"Test 5 — After clear, cache miss: {result}")  # Should print None
assert result is None

print("\n=== All tests passed ===")
print("Check the cache/ folder — it should now be empty under cache/tavily/")