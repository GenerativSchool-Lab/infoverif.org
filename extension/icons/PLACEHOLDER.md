# Extension Icons

**Status**: Placeholder needed

## Required Sizes

- `icon16.png` - 16x16px (toolbar)
- `icon32.png` - 32x32px (Windows)
- `icon48.png` - 48x48px (extension management)
- `icon128.png` - 128x128px (Chrome Web Store)

## Design Guidelines

**Style**: Minimalist, black & white theme (matching InfoVerif brand)

**Concept Ideas**:
1. Shield with magnifying glass (protection + analysis)
2. Speech bubble with checkmark/X (content verification)
3. Eye with DIMA code overlay (detection)
4. Abstract "i" letterform with forensic elements

**Colors**:
- Primary: Black (#000000)
- Accent: White (#FFFFFF)
- Optional: Single accent color for Web Store listing

## Quick Placeholder (SVG → PNG)

For now, create simple text-based placeholders:

```svg
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" fill="#000"/>
  <text x="64" y="72" font-size="64" fill="#fff" text-anchor="middle" font-family="Arial">IV</text>
</svg>
```

## Tools

- **Figma**: https://figma.com (vector design)
- **Export**: PNG @1x, @2x for retina
- **Optimize**: Use ImageOptim or similar

## TODO

- [ ] Design professional icons
- [ ] Export all 4 sizes
- [ ] Add to `/extension/icons/`
- [ ] Test in Chrome extension UI

