#!/usr/bin/env python3
"""Precompute embeddings for fact-checks."""
import sys
import json
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "api"))

from factcheck import load_factcheck_index, get_model

def main():
    """Precompute embeddings."""
    print("Loading fact-check index...")
    load_factcheck_index()
    
    data_file = Path(__file__).parent.parent / "data" / "factchecks.json"
    
    with open(data_file, "r") as f:
        factchecks = json.load(f)
    
    print(f"Loaded {len(factchecks)} fact-checks")
    
    # Get model to force load
    model = get_model()
    print("Model loaded successfully")
    
    # Embed all fact-checks
    texts = [fc.get("text", fc.get("title", "")) for fc in factchecks]
    embeddings = model.encode(texts, show_progress_bar=True)
    
    print(f"Generated {len(embeddings)} embeddings")
    print("✓ Embeddings ready for use in API")

if __name__ == "__main__":
    main()

