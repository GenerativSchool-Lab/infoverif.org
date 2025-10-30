# Lightweight MVP - No PyTorch/CUDA + Optimized Caching

## Changes Made for Faster Deployment

### Removed Heavy Dependencies
- ❌ `sentence-transformers==2.3.1` (pulls in PyTorch + CUDA, ~2GB)
- ❌ `faiss-cpu==1.7.4` (not needed with TF-IDF)

### Added Lightweight Alternative
- ✅ `scikit-learn==1.4.0` (lightweight, ~50MB, no PyTorch)

### Impact
- **Build time**: Reduced from ~60 minutes → ~10-15 minutes
- **Image size**: Reduced by ~2GB (no CUDA libraries)
- **Functionality**: Still works! TF-IDF + cosine similarity for fact-check matching

## Optimized Caching for Faster Redeployments

### Cache Strategy
Nixpacks now caches:
- `/tmp/pip-cache` - pip wheel cache
- `/root/.cache/pip` - pip's default cache directory

### Smart Reinstall Strategy
- Uses `--upgrade-strategy only-if-needed`
- If `requirements.txt` hasn't changed, pip will detect installed packages and skip reinstall
- Only downloads/built packages if requirements changed

### Expected Redeploy Times
- **First deploy**: ~10-15 minutes (full install)
- **Code-only changes** (no requirements.txt change): ~2-5 minutes (cached dependencies)
- **Requirements.txt changes**: ~10-15 minutes (reinstall affected packages)

### How It Works
1. Nixpacks copies files and checks cache
2. If `requirements.txt` unchanged → pip cache hit → skips download
3. If packages already installed → pip detects → skips install
4. Only rebuilds layers that changed

## Technical Details

### Before (Heavy)
- `sentence-transformers` → PyTorch → CUDA libraries
- FAISS for vector search
- Transformer embeddings (~400MB model download)

### After (Lightweight)
- `scikit-learn` TF-IDF vectorizer
- Cosine similarity for matching
- No model downloads, no PyTorch

### Performance Trade-offs
- **Similarity quality**: TF-IDF is slightly less semantic than transformers, but good enough for MVP
- **Speed**: Faster at runtime (no model loading)
- **Accuracy**: Still effective for keyword-based matching

## Testing

The fact-check matching still works, but uses TF-IDF instead of embeddings. Results should be similar for keyword-based claims.

