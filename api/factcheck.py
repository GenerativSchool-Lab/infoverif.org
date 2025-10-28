"""Fact-check matching using FAISS and sentence transformers."""
import json
import os
from typing import List, Dict
from pathlib import Path
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer


# Global model and index
_embedding_model = None
_factcheck_index = None
_factcheck_metadata = []


def get_model():
    """Get or load embedding model."""
    global _embedding_model
    if _embedding_model is None:
        model_name = os.getenv("EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
        _embedding_model = SentenceTransformer(model_name)
    return _embedding_model


def load_factcheck_index():
    """Load fact-check index from data file."""
    global _factcheck_index, _factcheck_metadata
    
    if _factcheck_index is not None:
        return
    
    # Load factchecks.json
    data_file = Path(__file__).parent.parent / "data" / "factchecks.json"
    if not data_file.exists():
        print("Warning: factchecks.json not found, running without fact-check matching")
        _factcheck_index = None
        _factcheck_metadata = []
        return
    
    with open(data_file, "r") as f:
        factchecks = json.load(f)
    
    if not factchecks:
        _factcheck_index = None
        _factcheck_metadata = []
        return
    
    # Get embedding model
    model = get_model()
    
    # Embed all fact-checks
    texts = [fc.get("text", fc.get("title", "")) for fc in factchecks]
    embeddings = model.encode(texts, convert_to_numpy=True)
    
    # Create FAISS index
    dimension = embeddings.shape[1]
    _factcheck_index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
    
    # Normalize embeddings for cosine similarity
    faiss.normalize_L2(embeddings)
    _factcheck_index.add(embeddings)
    
    # Store metadata
    _factcheck_metadata = factchecks
    
    print(f"Loaded {len(factchecks)} fact-checks into FAISS index")


def match_factchecks(claims: List[Dict], top_k: int = 3) -> List[Dict]:
    """
    Match claims against fact-check database.
    
    Args:
        claims: List of extracted claims
        top_k: Number of matches per claim
    
    Returns:
        List of matched fact-checks
    """
    # Lazy load index
    load_factcheck_index()
    
    if _factcheck_index is None:
        return []
    
    if not claims:
        return []
    
    model = get_model()
    claim_texts = [claim["text"] for claim in claims]
    claim_embeddings = model.encode(claim_texts, convert_to_numpy=True)
    faiss.normalize_L2(claim_embeddings)
    
    # Search
    k = min(top_k, len(_factcheck_metadata))
    distances, indices = _factcheck_index.search(claim_embeddings, k)
    
    # Build results
    results = []
    seen_ids = set()
    
    for i, (dist_row, idx_row) in enumerate(zip(distances, indices)):
        for dist, idx in zip(dist_row, idx_row):
            if idx >= len(_factcheck_metadata):
                continue
            
            factcheck = _factcheck_metadata[idx]
            factcheck_id = factcheck.get("id", f"{idx}")
            
            # Deduplicate
            if factcheck_id in seen_ids:
                continue
            seen_ids.add(factcheck_id)
            
            # Cosine similarity (already normalized)
            similarity = float(dist)
            
            results.append({
                "title": factcheck.get("title", ""),
                "url": factcheck.get("url", ""),
                "text": factcheck.get("text", "")[:200],  # Truncate
                "similarity": round(similarity, 2),
                "claim_text": claim_texts[i]
            })
    
    # Sort by similarity
    results.sort(key=lambda x: x["similarity"], reverse=True)
    
    return results[:top_k]

