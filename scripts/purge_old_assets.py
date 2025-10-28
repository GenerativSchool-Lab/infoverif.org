#!/usr/bin/env python3
"""Purge old assets manually."""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "api"))

from storage import purge_old_assets

def main():
    """Run purge."""
    print("Purging old assets...")
    purge_old_assets()
    print("✓ Purge complete")

if __name__ == "__main__":
    main()

