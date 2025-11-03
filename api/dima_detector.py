"""
DIMA Semantic Layer — Detector Module
Loads DIMA taxonomy and provides utilities for DIMA-aware analysis.
"""
import csv
import json
from pathlib import Path
from typing import Dict, List, Optional


class DIMADetector:
    """DIMA taxonomy loader and helper utilities."""
    
    def __init__(self, csv_path: str = None, examples_dir: str = None):
        """
        Initialize DIMA detector with taxonomy and examples.
        
        Args:
            csv_path: Path to DIMA_Full_Mapping.csv (default: ../docs/DIMA_Full_Mapping.csv)
            examples_dir: Path to examples directory (default: ../data/dima_examples/)
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
        
        # Load taxonomy at initialization
        self._load_taxonomy()
    
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

