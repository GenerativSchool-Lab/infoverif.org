# InfoVerif Web

React frontend for video integrity analysis.

## Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

Set `VITE_API_URL` to your backend URL.

## Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

Frontend will be available at http://localhost:5173

## Deployment

### Vercel

1. Connect Vercel to `/web` directory
2. Set environment variables
3. Build command: `npm run build`
4. Deploy

The Vercel config handles routing automatically.

