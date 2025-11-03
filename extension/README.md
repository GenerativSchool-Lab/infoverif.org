# InfoVerif Chrome Extension

**Version**: 1.0.0 (Alpha)  
**Status**: Development  

## Quick Start (Development)

1. **Load Unpacked Extension**:
   ```bash
   # Open Chrome
   chrome://extensions/
   
   # Enable "Developer mode" (top-right toggle)
   # Click "Load unpacked"
   # Select: /path/to/infoverif.org/extension
   ```

2. **Test on Twitter/X**:
   - Navigate to https://twitter.com or https://x.com
   - Hover over a tweet → "Analyze with InfoVerif" button appears
   - Click "Analyze" → Floating panel opens with report
   - Works for text tweets and tweets with videos

3. **Test on TikTok**:
   - Navigate to https://tiktok.com
   - Fixed "Analyze with InfoVerif" button appears (bottom-left)
   - Click "Analyze" → Floating panel opens with report
   - Works on all page types (video, feed, search)

## Architecture

See: `/docs/Chrome_Extension_Implementation_Plan.md` for full implementation details.

```
extension/
├── manifest.json           # MV3 config
├── background.js           # Service worker
├── contentScript.js        # DOM extraction
├── ui/
│   ├── panel.html         # Side panel
│   ├── panel.js           # Report rendering
│   └── panel.css          # Styles
├── styles/
│   └── content.css        # Selection overlay styles
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── shared/
│   ├── constants.js       # Config (API_URL, etc.)
│   └── messages.js        # Message contracts
└── lib/
    ├── selectors.js       # Platform selectors
    └── utils.js           # DOM helpers
```

## Backend Setup

Extension requires backend API running:

```bash
# Backend must be accessible at:
https://infoveriforg-production.up.railway.app

# Or for local dev:
http://localhost:8000

# Update shared/constants.js with correct API_URL
```

## Supported Platforms

- ✅ **Twitter/X** : Hover detection, text + video analysis
- ✅ **TikTok** : Fixed button, universal detection (all page types)

**Note** : Other platforms (YouTube, Instagram, Facebook) can be analyzed via the [web application](https://infoverif.org).

## Privacy

- ✅ No tracking, no analytics
- ✅ Content sent to server only on user action
- ✅ No persistent storage of analyzed content
- ✅ Analysis results stored in session only (cleared on browser close)

## License

MIT © GenerativSchool Civic Tech AI Lab

