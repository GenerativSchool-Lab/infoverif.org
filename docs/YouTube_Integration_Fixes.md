# YouTube Integration - Issues & Fixes

**Status:** 🟡 Identified - To be fixed after Twitter optimization complete  
**Priority:** High  
**Created:** 2025-11-03  

---

## 🐛 **Issues Identified**

### **Issue 1: No Floating Panel on YouTube**

**Problem:**
- YouTube uses **old side panel code** (obsolete)
- Floating panel NOT injected like on Twitter
- No loading state, no report display in panel

**Current Code Location:**
- `extension/contentScript-bundle.js` lines 516-575
- Function: `handleYouTubeAnalyze()`

**What's Wrong:**
```javascript
async function handleYouTubeAnalyze() {
  // ❌ Missing: await injectFloatingPanel()
  // ❌ Missing: showPanelLoading()
  
  const response = await chrome.runtime.sendMessage(message);
  
  if (response.success) {
    // ❌ Old code: sends OPEN_PANEL (doesn't exist anymore)
    chrome.runtime.sendMessage({ type: 'OPEN_PANEL' })
    
    // ❌ Missing: showPanelReport(response.report)
  }
}
```

**What Twitter Does (CORRECT):**
```javascript
async function handleAnalyzeClick(element, platform) {
  // ✅ Inject panel first
  await injectFloatingPanel();
  
  // ✅ Show loading
  showPanelLoading();
  
  // ✅ Get response
  const response = await chrome.runtime.sendMessage(message);
  
  // ✅ Show report in panel
  if (response.success && response.report) {
    showPanelReport(response.report);
  }
}
```

**Fix Required:**
1. Add `await injectFloatingPanel()` at start
2. Call `showPanelLoading()` before analysis
3. Call `showPanelReport(response.report)` on success
4. Remove obsolete `OPEN_PANEL` message
5. Add error handling with `showPanelError()`

---

### **Issue 2: YouTube Shorts Not Detected**

**Problem:**
- Extension looks for `ytd-watch-flexy` (classic YouTube videos only)
- Shorts use **different DOM structure**: `ytd-shorts`, `ytd-reel-video-renderer`
- Button never appears on Shorts

**Current Code:**
```javascript
const YOUTUBE_SELECTORS = {
  videoContainer: {
    primary: 'ytd-watch-flexy'  // ❌ Only works for classic videos
  }
};

await waitForElement(YOUTUBE_SELECTORS.videoContainer.primary, 10000);
// Times out on Shorts after 10s, no button shown
```

**DOM Structure Difference:**

**Classic Videos:**
```html
<ytd-watch-flexy>
  <div id="movie_player">
```

**Shorts:**
```html
<ytd-shorts>
  <ytd-reel-video-renderer>
    <div id="shorts-player">
```

**Fix Required:**
1. Add Shorts selector: `ytd-shorts` or `ytd-reel-video-renderer`
2. Detect URL pattern: `/shorts/` in `window.location.pathname`
3. Use appropriate container for button injection
4. Test both classic videos AND Shorts

---

### **Issue 3: 422 Unprocessable Entity Error**

**Problem:**
- Backend returns `422` when analyzing YouTube URLs
- Error means: **FastAPI validation failed** (Form parameters)

**Possible Causes:**

**A) Backend not deployed yet with new `/analyze-video-url` endpoint:**
```bash
# Check if endpoint exists:
curl -X POST https://infoveriforg-production.up.railway.app/analyze-video-url \
  -F 'url=https://www.youtube.com/watch?v=test' \
  -F 'platform=youtube'
```

**B) URL format issue:**
```javascript
// Extension sends:
{ url: "https://www.youtube.com/watch?v=xxxxx" }

// Backend expects FormData with:
url: str = Form(...)  // Must be form-encoded, not JSON
platform: Optional[str] = Form("video")
```

**C) yt-dlp not installed on Railway:**
- Check Railway build logs for: `yt-dlp>=2023.12.30`
- Check if ffmpeg is available (needed for audio extraction)

**Fix Required:**
1. Verify Railway deployment completed successfully
2. Check Railway logs for actual error message
3. Test endpoint manually with curl (see example above)
4. Ensure `requirements-lite.txt` includes yt-dlp
5. Verify Docker image has ffmpeg installed

---

## 🔧 **Implementation Plan**

### **Step 1: Fix Floating Panel Integration**

**Files to modify:**
- `extension/contentScript-bundle.js`

**Changes:**
```javascript
async function handleYouTubeAnalyze() {
  debugLog('CONTENT_SCRIPT', 'Analyze clicked for YouTube');
  
  try {
    // ✅ 1. Inject panel
    await injectFloatingPanel();
    
    const button = document.getElementById('infoverif-youtube-button');
    if (button) {
      button.disabled = true;
      button.textContent = 'Analyse en cours...';
    }
    
    // ✅ 2. Show loading in panel
    showPanelLoading();
    
    // Extract data
    const extracted = extractYouTubeData();
    const message = createAnalyzeRequest(
      'video',
      PLATFORMS.YOUTUBE,
      { url: extracted.url },
      extracted.metadata
    );
    
    const response = await chrome.runtime.sendMessage(message);
    
    if (response.success && response.report) {
      debugLog('CONTENT_SCRIPT', 'YouTube analysis complete');
      
      // ✅ 3. Show report in floating panel
      showPanelReport(response.report);
      
      if (button) {
        button.textContent = '✓ Analyse terminée';
        setTimeout(() => {
          button.disabled = false;
          button.innerHTML = `
            <span class="infoverif-icon">🛡️</span>
            <span class="infoverif-text">Analyser avec InfoVerif</span>
          `;
        }, 3000);
      }
    } else {
      // ✅ 4. Show error
      showPanelError(response.message || 'Erreur lors de l\'analyse');
      
      if (button) {
        button.textContent = '✗ Erreur';
        button.disabled = false;
      }
    }
  } catch (error) {
    console.error('[InfoVerif] YouTube analyze error:', error);
    
    // ✅ 5. Show error in panel
    showPanelError(error.message);
    
    const button = document.getElementById('infoverif-youtube-button');
    if (button) {
      if (error.message.includes('Extension context invalidated') || 
          error.message.includes('message port closed')) {
        button.textContent = '✗ Rafraîchissez (F5)';
      } else {
        button.textContent = '✗ Erreur';
      }
      button.disabled = false;
    }
  }
}
```

---

### **Step 2: Add YouTube Shorts Support**

**Files to modify:**
- `extension/contentScript-bundle.js`

**Changes:**

1. **Update selectors:**
```javascript
const YOUTUBE_SELECTORS = {
  videoContainer: {
    primary: 'ytd-watch-flexy',          // Classic videos
    shorts: 'ytd-shorts',                 // Shorts page
    reelRenderer: 'ytd-reel-video-renderer' // Individual short
  },
  player: {
    classic: '#movie_player',
    shorts: '#shorts-player'
  },
  // ... rest
};
```

2. **Update detection function:**
```javascript
async function detectYouTubeVideo() {
  debugLog('CONTENT_SCRIPT', 'Waiting for YouTube video...');
  
  try {
    // Detect if we're on Shorts
    const isShorts = window.location.pathname.includes('/shorts/');
    
    if (isShorts) {
      // Wait for Shorts container
      await waitForElement(YOUTUBE_SELECTORS.videoContainer.shorts, 10000);
      debugLog('CONTENT_SCRIPT', 'YouTube Shorts detected');
    } else {
      // Wait for classic video container
      await waitForElement(YOUTUBE_SELECTORS.videoContainer.primary, 10000);
      debugLog('CONTENT_SCRIPT', 'YouTube classic video detected');
    }
    
    showYouTubeAnalyzeButton(isShorts);
  } catch (error) {
    console.warn('[InfoVerif] YouTube video not found:', error);
  }
}
```

3. **Update button injection:**
```javascript
function showYouTubeAnalyzeButton(isShorts = false) {
  if (document.getElementById('infoverif-youtube-button')) return;
  
  const button = document.createElement('button');
  button.id = 'infoverif-youtube-button';
  button.className = 'infoverif-youtube-analyze-btn';
  button.innerHTML = `
    <span class="infoverif-icon">🛡️</span>
    <span class="infoverif-text">Analyser avec InfoVerif</span>
  `;
  
  button.addEventListener('click', () => handleYouTubeAnalyze());
  
  // Choose container based on video type
  let playerContainer;
  if (isShorts) {
    playerContainer = document.querySelector('#shorts-player') || 
                     document.querySelector(YOUTUBE_SELECTORS.videoContainer.shorts);
  } else {
    playerContainer = document.querySelector('#movie_player') || 
                     document.querySelector(YOUTUBE_SELECTORS.videoContainer.primary);
  }
  
  if (playerContainer) {
    playerContainer.appendChild(button);
  } else {
    document.body.appendChild(button);
  }
  
  debugLog('CONTENT_SCRIPT', `YouTube button injected (${isShorts ? 'Shorts' : 'Classic'})`);
}
```

---

### **Step 3: Debug 422 Error**

**Actions:**

1. **Check Railway deployment:**
```bash
# Verify new endpoint exists
curl -I https://infoveriforg-production.up.railway.app/analyze-video-url

# Should return: HTTP/1.1 405 Method Not Allowed (GET not allowed, POST required)
# If 404: endpoint not deployed yet
```

2. **Test with valid YouTube URL:**
```bash
curl -X POST https://infoveriforg-production.up.railway.app/analyze-video-url \
  -F 'url=https://www.youtube.com/watch?v=dQw4w9WgXcQ' \
  -F 'platform=youtube'
  
# Expected: 200 OK with analysis JSON
# If 422: Check Railway logs for exact validation error
```

3. **Check Railway logs:**
```bash
railway logs --service infoverif.org

# Look for:
# - "yt-dlp download failed"
# - "FFmpeg error"
# - "422 Unprocessable Entity" with details
# - Python traceback
```

4. **Verify dependencies installed:**
```bash
# In Railway logs, check for:
# ✅ Successfully installed yt-dlp-2023.12.30
# ✅ ffmpeg --version
```

---

## 🧪 **Testing Checklist**

### **Classic YouTube Videos**
- [ ] Button appears (bottom-right floating)
- [ ] Click → Panel injects
- [ ] Loading state shows in panel
- [ ] Analysis completes (~15-20s)
- [ ] Report displays with:
  - [ ] Transcript excerpt
  - [ ] Scores (4 bars)
  - [ ] Techniques DIMA
  - [ ] Claims
  - [ ] Summary

### **YouTube Shorts**
- [ ] Button appears (needs positioning adjustment for Shorts)
- [ ] Click → Panel injects
- [ ] Loading state shows
- [ ] Analysis completes
- [ ] Report displays correctly
- [ ] URL conversion: `/shorts/ID` → `/watch?v=ID` works

### **Error Cases**
- [ ] Private video → Error message in panel
- [ ] Deleted video → Error message
- [ ] Invalid URL → Error message
- [ ] Network timeout → Retry logic works

---

## 📊 **Success Criteria**

✅ **Floating panel works on YouTube exactly like Twitter:**
- Same black & white design
- Same loading/success/error states
- Draggable, resizable, minimizable

✅ **Both video types supported:**
- Classic videos (/watch?v=)
- Shorts (/shorts/)

✅ **No 422 errors:**
- Backend deployed with yt-dlp
- Audio download works
- Whisper transcription works
- Analysis returns complete report

✅ **Performance acceptable:**
- Analysis completes in < 30s for 5-min video
- Audio download optimized (audio-only, not full video)
- Temp files cleaned up

---

## 🔗 **Related Files**

**Extension:**
- `extension/contentScript-bundle.js` (main changes)
- `extension/ui/floating-panel.js` (already works, no changes)
- `extension/ui/floating-panel.css` (already works, no changes)
- `extension/background-bundle.js` (already updated)

**Backend:**
- `api/deep.py` (already has `download_audio_from_url()` and `analyze_url()`)
- `api/main.py` (already has `/analyze-video-url` endpoint)
- `api/requirements-lite.txt` (already has yt-dlp)

**Docs:**
- This file: Track progress
- `docs/Chrome_Extension_Implementation_Plan.md` (original plan)

---

## 📝 **Notes**

- Wait for Railway deployment to complete before testing backend
- Twitter video analysis should work first (same backend endpoint)
- Shorts positioning might need CSS adjustment (different player size)
- Consider rate limiting for video analysis (expensive: Whisper API costs)

---

**Last Updated:** 2025-11-03  
**Next Action:** Complete Twitter optimization, then return to this file

