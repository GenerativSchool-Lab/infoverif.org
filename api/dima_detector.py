"""
DIMA Semantic Layer — Detector Module
Loads DIMA taxonomy and provides utilities for DIMA-aware analysis.
"""
import csv
import json
import os
from pathlib import Path
from typing import Dict, List, Optional

# M2.2: Semantic Embeddings (optional imports)
try:
    import numpy as np
    import faiss
    from sentence_transformers import SentenceTransformer
    EMBEDDINGS_AVAILABLE = True
except ImportError:
    EMBEDDINGS_AVAILABLE = False
    print("⚠️  Embeddings libraries not available (sentence-transformers, faiss-cpu)")


class DIMADetector:
    """DIMA taxonomy loader and helper utilities."""
    
    def __init__(self, csv_path: str = None, examples_dir: str = None, enable_embeddings: bool = True):
        """
        Initialize DIMA detector with taxonomy and examples.
        
        Args:
            csv_path: Path to DIMA_Full_Mapping.csv (default: ../docs/DIMA_Full_Mapping.csv)
            examples_dir: Path to examples directory (default: ../data/dima_examples/)
            enable_embeddings: Load semantic embeddings if available (default: True)
        """
        if csv_path is None:
            # Default: relative to api/ directory
            base_dir = Path(__file__).parent.parent
            csv_path = str(base_dir / "docs" / "DIMA_Full_Mapping.csv")
        
        if examples_dir is None:
            base_dir = Path(__file__).parent.parent
            examples_dir = str(base_dir / "data" / "dima_examples")
        
        self.csv_path = csv_path
        self.examples_dir = Path(examples_dir)
        self.taxonomy: Dict[str, Dict] = {}
        self.families: Dict[str, List[str]] = {}
        
        # M2.2: Embeddings support
        self.embeddings_enabled = enable_embeddings and EMBEDDINGS_AVAILABLE
        self.embeddings: Optional[np.ndarray] = None
        self.faiss_index = None
        self.encoder_model = None
        
        # Load taxonomy at initialization
        self._load_taxonomy()
        
        # Load embeddings if enabled
        if self.embeddings_enabled:
            self._load_embeddings()
    
    def _load_taxonomy(self):
        """Load DIMA taxonomy from CSV file."""
        try:
            with open(self.csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    code = row['dima_code']
                    self.taxonomy[code] = {
                        'code': code,
                        'name_fr': row['technique_name_fr'],
                        'name_en': row['technique_name_en'],
                        'family': row['dima_family'],
                        'infoverif_primary': row['infoverif_primary'],
                        'infoverif_secondary': row.get('infoverif_secondary', ''),
                        'weight_I_p': float(row['weight_I_p']),
                        'weight_N_s': float(row['weight_N_s']),
                        'weight_F_f': float(row['weight_F_f']),
                        'semantic_features': row['semantic_features'],
                        'example_keywords': row['example_keywords']
                    }
                    
                    # Group by family
                    family = row['dima_family']
                    if family not in self.families:
                        self.families[family] = []
                    self.families[family].append(code)
            
            print(f"✅ DIMA taxonomy loaded: {len(self.taxonomy)} techniques, {len(self.families)} families")
        
        except FileNotFoundError:
            print(f"⚠️  DIMA taxonomy CSV not found at {self.csv_path}")
            # Continue with empty taxonomy (graceful degradation)
        
        except Exception as e:
            print(f"⚠️  Error loading DIMA taxonomy: {e}")
    
    def get_technique(self, code: str) -> Optional[Dict]:
        """
        Get technique details by DIMA code.
        
        Args:
            code: DIMA code (e.g., "TE-58")
        
        Returns:
            Technique dictionary or None if not found
        """
        return self.taxonomy.get(code)
    
    def get_family_techniques(self, family: str) -> List[str]:
        """
        Get all technique codes for a given family.
        
        Args:
            family: DIMA family name (e.g., "Émotion", "Simplification")
        
        Returns:
            List of technique codes
        """
        return self.families.get(family, [])
    
    def get_all_families(self) -> List[str]:
        """Get all DIMA family names."""
        return list(self.families.keys())
    
    def get_taxonomy_stats(self) -> Dict:
        """Get taxonomy statistics."""
        return {
            'total_techniques': len(self.taxonomy),
            'total_families': len(self.families),
            'techniques_by_family': {
                family: len(codes) for family, codes in self.families.items()
            }
        }
    
    def get_few_shot_examples(self, technique_code: str, n: int = 2) -> List[Dict]:
        """
        Load few-shot examples for a specific technique.
        
        Args:
            technique_code: DIMA code (e.g., "TE-58")
            n: Number of examples to return (default: 2)
        
        Returns:
            List of example dictionaries with content_fr, evidence_span, etc.
        """
        examples = []
        
        # Map technique code to example file
        # e.g., TE-01 -> TE-01_appel_emotion_examples.json
        technique = self.get_technique(technique_code)
        if not technique:
            return examples
        
        # Try to find example file
        # Pattern: TE-XX_*.json
        example_files = list(self.examples_dir.glob(f"{technique_code}_*.json"))
        
        if not example_files:
            return examples
        
        try:
            with open(example_files[0], 'r', encoding='utf-8') as f:
                data = json.load(f)
                technique_examples = data.get('examples', [])
                
                # Return up to n examples
                for example in technique_examples[:n]:
                    examples.append({
                        'id': example.get('id'),
                        'content_fr': example.get('content_fr', ''),
                        'evidence_span': example.get('evidence_span', ''),
                        'explanation': example.get('annotation_notes', ''),
                        'scores': example.get('infoverif_scores', {})
                    })
        
        except Exception as e:
            print(f"⚠️  Error loading examples for {technique_code}: {e}")
        
        return examples
    
    def build_compact_taxonomy_string(self) -> str:
        """
        Build compact taxonomy string for prompt injection.
        
        Format:
        FAMILLE ÉMOTION (10 techniques):
        - TE-01: Appel à l'émotion | TE-02: Peur / Menace | TE-03: Indignation
        ...
        
        Returns:
            Compact taxonomy string (~3000-3500 tokens)
        """
        lines = []
        lines.append("TAXONOMIE DIMA COMPLÈTE (130 techniques de manipulation):")
        lines.append("")
        
        # Order families for clarity
        family_order = [
            "Émotion", "Simplification", "Discrédit", 
            "Diversion", "Décontextualisation", "Rhétorique"
        ]
        
        for family in family_order:
            if family not in self.families:
                continue
            
            codes = self.families[family]
            lines.append(f"FAMILLE {family.upper()} ({len(codes)} techniques):")
            
            # Group techniques in lines of 3-4 for readability
            techniques_list = []
            for code in codes:
                tech = self.taxonomy[code]
                techniques_list.append(f"{code}: {tech['name_fr']}")
            
            # Join in compact format with pipes
            for i in range(0, len(techniques_list), 4):
                chunk = techniques_list[i:i+4]
                lines.append(f"  {' | '.join(chunk)}")
            
            lines.append("")
        
        return "\n".join(lines)
    
    def map_technique_name_to_code(self, name: str) -> Optional[str]:
        """
        Reverse lookup: Find DIMA code by technique name (fuzzy match).
        
        Args:
            name: Technique name (French or English)
        
        Returns:
            DIMA code or None if not found
        """
        name_lower = name.lower().strip()
        
        # Exact match first
        for code, tech in self.taxonomy.items():
            if tech['name_fr'].lower() == name_lower:
                return code
            if tech['name_en'].lower() == name_lower:
                return code
        
        # Fuzzy match (contains)
        for code, tech in self.taxonomy.items():
            if name_lower in tech['name_fr'].lower():
                return code
            if name_lower in tech['name_en'].lower():
                return code
        
        return None
    
    def _load_embeddings(self):
        """
        Load precomputed embeddings and build FAISS index (M2.2).
        
        Tries to load from data/dima_embeddings.npy. If not found, generates them
        on-the-fly using sentence-transformers.
        """
        if not EMBEDDINGS_AVAILABLE:
            print("⚠️  Embeddings disabled: sentence-transformers not installed")
            return
        
        base_dir = Path(__file__).parent.parent
        embeddings_path = base_dir / "data" / "dima_embeddings.npy"
        
        try:
            # Try to load precomputed embeddings
            if embeddings_path.exists():
                print(f"🔄 Loading precomputed embeddings from {embeddings_path}...")
                self.embeddings = np.load(embeddings_path).astype('float32')
                print(f"✅ Loaded embeddings: shape={self.embeddings.shape}")
            else:
                # Generate embeddings on-the-fly (first run)
                print("⚠️  Precomputed embeddings not found, generating on-the-fly...")
                print("   This will download ~470MB model on first run...")
                self._generate_embeddings()
            
            # Validate embeddings
            if self.embeddings is None or len(self.embeddings) != len(self.taxonomy):
                raise ValueError(f"Embeddings count mismatch: {len(self.embeddings)} vs {len(self.taxonomy)}")
            
            # Build FAISS index for fast similarity search
            dimension = self.embeddings.shape[1]  # Should be 384
            self.faiss_index = faiss.IndexFlatIP(dimension)  # Inner product (cosine similarity)
            
            # Normalize embeddings for cosine similarity
            faiss.normalize_L2(self.embeddings)
            self.faiss_index.add(self.embeddings)
            
            # Load encoder model for runtime queries
            self.encoder_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
            
            print(f"✅ FAISS index built: {len(self.embeddings)} vectors, dim={dimension}")
            print(f"✅ Encoder model loaded: paraphrase-multilingual-MiniLM-L12-v2")
        
        except Exception as e:
            print(f"⚠️  Could not load embeddings: {e}")
            print("   Continuing without embeddings (degraded mode)")
            self.embeddings = None
            self.faiss_index = None
            self.encoder_model = None
    
    def _generate_embeddings(self):
        """Generate embeddings on-the-fly if precomputed file not found."""
        print("🔄 Generating embeddings for 130 techniques...")
        
        # Load model
        model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        
        # Build texts from taxonomy (same format as precompute script)
        texts = []
        for code in sorted(self.taxonomy.keys()):  # Ensure consistent order
            tech = self.taxonomy[code]
            text = (
                f"{tech['name_fr']}. "
                f"{tech['semantic_features']}. "
                f"Exemples: {tech['example_keywords']}"
            )
            texts.append(text)
        
        # Encode
        embeddings = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
        self.embeddings = embeddings.astype('float32')
        
        # Save for future runs
        embeddings_path = Path(__file__).parent.parent / "data" / "dima_embeddings.npy"
        embeddings_path.parent.mkdir(exist_ok=True)
        np.save(embeddings_path, self.embeddings)
        
        print(f"✅ Generated and saved embeddings: {self.embeddings.shape}")
    
    def find_similar_techniques(self, text: str, top_k: int = 5, min_similarity: float = 0.3) -> List[Dict]:
        """
        Find most similar DIMA techniques using semantic embeddings (M2.2).
        
        Args:
            text: Content to analyze
            top_k: Number of similar techniques to return (default: 5)
            min_similarity: Minimum similarity threshold 0-1 (default: 0.3)
        
        Returns:
            List of dicts with code, name, family, similarity, rank
        """
        if self.faiss_index is None or self.encoder_model is None:
            return []
        
        try:
            # Encode query text
            query_embedding = self.encoder_model.encode([text], convert_to_numpy=True).astype('float32')
            
            # Normalize for cosine similarity
            faiss.normalize_L2(query_embedding)
            
            # Search FAISS index (returns cosine similarity scores)
            similarities, indices = self.faiss_index.search(query_embedding, top_k)
            
            # Build results
            results = []
            codes_list = sorted(self.taxonomy.keys())  # Same order as embeddings
            
            for rank, (similarity, idx) in enumerate(zip(similarities[0], indices[0]), 1):
                if idx >= len(codes_list):
                    continue
                
                # Filter by minimum similarity
                if similarity < min_similarity:
                    continue
                
                code = codes_list[idx]
                technique = self.taxonomy[code]
                
                results.append({
                    'code': code,
                    'name': technique['name_fr'],
                    'family': technique['family'],
                    'similarity': float(similarity),
                    'rank': rank
                })
            
            return results
        
        except Exception as e:
            print(f"⚠️  Error in similarity search: {e}")
            return []
    
    def is_embeddings_enabled(self) -> bool:
        """Check if embeddings are loaded and ready."""
        return self.faiss_index is not None and self.encoder_model is not None


# Global singleton instance (loaded at FastAPI startup)
_detector_instance: Optional[DIMADetector] = None


def get_detector() -> DIMADetector:
    """
    Get global DIMA detector instance (singleton pattern).
    
    Returns:
        DIMADetector instance
    """
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = DIMADetector()
    return _detector_instance


def load_dima_taxonomy() -> Dict[str, Dict]:
    """
    Load DIMA taxonomy (convenience function).
    
    Returns:
        Dictionary mapping DIMA codes to technique data
    """
    detector = get_detector()
    return detector.taxonomy


# Module-level initialization test
if __name__ == "__main__":
    print("Testing DIMA Detector...")
    detector = DIMADetector()
    
    print(f"\n📊 Stats: {detector.get_taxonomy_stats()}")
    
    print("\n🔍 Testing technique lookup:")
    te58 = detector.get_technique("TE-58")
    if te58:
        print(f"  TE-58: {te58['name_fr']} (Family: {te58['family']})")
    
    print("\n📚 Testing few-shot examples:")
    examples = detector.get_few_shot_examples("TE-58", n=2)
    print(f"  Found {len(examples)} examples for TE-58")
    
    print("\n📝 Compact taxonomy preview (first 500 chars):")
    compact = detector.build_compact_taxonomy_string()
    print(compact[:500] + "...")
    print(f"\n  Total length: {len(compact)} chars (~{len(compact.split())} words)")

