#!/usr/bin/env python3
"""
DIMA Mapping Validator
Checks integrity of DIMA_Full_Mapping.csv
"""
import csv
import sys
from pathlib import Path

def validate_dima_mapping(csv_path: str) -> bool:
    """Validate DIMA mapping CSV file."""
    errors = []
    warnings = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f"✓ Loaded {len(rows)} techniques from {csv_path}")
    
    # Check 1: Verify 130 techniques
    if len(rows) != 130:
        errors.append(f"Expected 130 techniques, found {len(rows)}")
    
    # Check 2: Verify all TE codes present (TE-01 to TE-130)
    expected_codes = {f"TE-{i:02d}" if i < 22 else f"TE-{i}" for i in range(1, 131) if i != 21}  # Skip TE-21
    actual_codes = {row['dima_code'] for row in rows}
    missing = expected_codes - actual_codes
    extra = actual_codes - expected_codes
    
    if missing:
        errors.append(f"Missing codes: {sorted(missing)}")
    if extra:
        warnings.append(f"Extra codes: {sorted(extra)}")
    
    # Check 3: Verify weights sum to ~1.0 for each technique
    for row in rows:
        code = row['dima_code']
        try:
            w_I_p = float(row['weight_I_p'])
            w_N_s = float(row['weight_N_s'])
            w_F_f = float(row['weight_F_f'])
            total = w_I_p + w_N_s + w_F_f
            
            if not (0.98 <= total <= 1.02):  # Allow 2% tolerance
                errors.append(f"{code}: weights sum to {total:.2f} (should be 1.0)")
            
            # Check ranges
            if not (0 <= w_I_p <= 1 and 0 <= w_N_s <= 1 and 0 <= w_F_f <= 1):
                errors.append(f"{code}: weights out of [0, 1] range")
                
        except ValueError as e:
            errors.append(f"{code}: invalid weight values - {e}")
    
    # Check 4: Verify primary category matches highest weight
    for row in rows:
        code = row['dima_code']
        primary = row['infoverif_primary']
        w_I_p = float(row['weight_I_p'])
        w_N_s = float(row['weight_N_s'])
        w_F_f = float(row['weight_F_f'])
        
        weights = {'I_p': w_I_p, 'N_s': w_N_s, 'F_f': w_F_f}
        expected_primary = max(weights, key=weights.get)
        
        if primary != expected_primary and weights[primary] < max(weights.values()) - 0.1:
            warnings.append(f"{code}: primary={primary} but highest weight is {expected_primary}")
    
    # Check 5: Verify no empty required fields
    required_fields = ['dima_code', 'technique_name_fr', 'technique_name_en', 
                       'dima_family', 'infoverif_primary', 'semantic_features']
    for row in rows:
        for field in required_fields:
            if not row[field] or row[field].strip() == '':
                errors.append(f"{row['dima_code']}: empty required field '{field}'")
    
    # Check 6: Verify family consistency
    families = set(row['dima_family'] for row in rows)
    expected_families = {'Émotion', 'Simplification', 'Discrédit', 'Diversion', 
                        'Décontextualisation', 'Rhétorique'}
    if families != expected_families:
        warnings.append(f"Family mismatch: {families} vs {expected_families}")
    
    # Print results
    print(f"\n{'='*60}")
    print("VALIDATION RESULTS")
    print(f"{'='*60}")
    
    if not errors and not warnings:
        print("✅ All checks passed! Mapping is valid.")
        return True
    
    if warnings:
        print(f"\n⚠️  {len(warnings)} WARNING(S):")
        for w in warnings[:10]:  # Show first 10
            print(f"  • {w}")
        if len(warnings) > 10:
            print(f"  ... and {len(warnings) - 10} more")
    
    if errors:
        print(f"\n❌ {len(errors)} ERROR(S):")
        for e in errors[:10]:  # Show first 10
            print(f"  • {e}")
        if len(errors) > 10:
            print(f"  ... and {len(errors) - 10} more")
        return False
    
    return True

if __name__ == "__main__":
    csv_path = Path(__file__).parent.parent / "docs" / "DIMA_Full_Mapping.csv"
    
    if not csv_path.exists():
        print(f"❌ File not found: {csv_path}")
        sys.exit(1)
    
    valid = validate_dima_mapping(str(csv_path))
    sys.exit(0 if valid else 1)
