#!/usr/bin/env python3
"""
Precompute DIMA Technique Embeddings
Generates semantic embeddings for all 130 DIMA techniques using sentence-transformers.
"""
import csv
import numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer


def main():
    """Generate and save DIMA technique embeddings."""
    
    # Paths
    project_root = Path(__file__).parent.parent
    csv_path = project_root / "docs" / "DIMA_Full_Mapping.csv"
    output_path = project_root / "data" / "dima_embeddings.npy"
    
    print("🔄 Loading DIMA taxonomy...")
    
    # Load DIMA techniques
    techniques = []
    codes = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Combine multiple fields for richer embeddings
            # Format: "Name. Semantic features. Example keywords."
            text = (
                f"{row['technique_name_fr']}. "
                f"{row['semantic_features']}. "
                f"Exemples: {row['example_keywords']}"
            )
            
            techniques.append(text)
            codes.append(row['dima_code'])
    
    print(f"✅ Loaded {len(techniques)} techniques")
    
    # Load sentence-transformers model (multilingual)
    print("\n🔄 Loading sentence-transformers model...")
    print("   Model: paraphrase-multilingual-MiniLM-L12-v2")
    print("   This will download ~470MB on first run...")
    
    model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
    
    print("✅ Model loaded")
    
    # Generate embeddings
    print(f"\n🔄 Encoding {len(techniques)} techniques...")
    embeddings = model.encode(
        techniques,
        show_progress_bar=True,
        batch_size=32,
        convert_to_numpy=True
    )
    
    print(f"✅ Embeddings generated: shape={embeddings.shape}")
    print(f"   Dimensions: {embeddings.shape[1]}")
    print(f"   Memory: ~{embeddings.nbytes / 1024:.1f} KB")
    
    # Validate embeddings
    assert embeddings.shape[0] == 130, f"Expected 130 embeddings, got {embeddings.shape[0]}"
    assert embeddings.shape[1] == 384, f"Expected 384 dimensions, got {embeddings.shape[1]}"
    
    # Save to disk
    output_path.parent.mkdir(exist_ok=True)
    np.save(output_path, embeddings)
    
    print(f"\n✅ Saved embeddings to: {output_path}")
    print(f"   File size: {output_path.stat().st_size / 1024:.1f} KB")
    
    # Test similarity (sanity check)
    print("\n🔍 Sanity check: Testing similarity search...")
    
    # Test query: "manipulation émotionnelle"
    test_query = "Ce contenu utilise la peur et l'urgence pour manipuler émotionnellement"
    test_embedding = model.encode([test_query])
    
    # Compute cosine similarity
    from sklearn.metrics.pairwise import cosine_similarity
    similarities = cosine_similarity(test_embedding, embeddings)[0]
    
    # Top 5 most similar
    top_indices = np.argsort(similarities)[::-1][:5]
    
    print(f"\n   Query: '{test_query}'")
    print("   Top 5 similar techniques:")
    for i, idx in enumerate(top_indices, 1):
        print(f"   {i}. {codes[idx]} - Similarity: {similarities[idx]:.3f}")
    
    print("\n🎉 Precomputation complete!")
    print(f"\n📝 Next steps:")
    print(f"   1. Commit: git add {output_path}")
    print(f"   2. Enhance api/dima_detector.py to load these embeddings")
    print(f"   3. Deploy to Railway with 2GB RAM")


if __name__ == "__main__":
    main()

