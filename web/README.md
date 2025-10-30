# InfoVerif Web

React frontend for InfoVerif (Lite: metadata-only analysis).

## Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

Set `VITE_API_URL` to your backend URL.

The frontend uses the lightweight synchronous endpoint `POST /analyze-lite`.
On success it navigates to `/report-lite` to display heuristics (score, reasons, features) and input metadata.

## Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

Frontend will be available at http://localhost:5173

Open the app and submit a video or page URL. The Lite flow only fetches and analyzes page metadata (title/description).

Routes:

- `/` — Home (submit URL, calls `/analyze-lite`)
- `/report-lite` — Displays the Lite report
- `/method-card` — Method & limitations (Lite mode)

## Deployment

### Vercel

1. Connect Vercel to `/web` directory
2. Set environment variables
3. Build command: `npm run build`
4. Deploy

The Vercel config handles routing automatically.

Note: The previous job-based full analysis flow has been sunset in the UI.

