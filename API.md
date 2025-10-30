# InfoVerif API Reference

Complete API documentation for the video integrity analysis service.

## Base URL

- Local: `http://localhost:8000`
- Production: `<your-railway-url>`

## Authentication

None required (MVP).

## Endpoints

### POST /analyze-lite

Run lightweight, synchronous metadata analysis (no background jobs).

Request:
```bash
curl -X POST http://localhost:8000/analyze-lite \
  -F "url=https://youtube.com/watch?v=..."
```

Parameters:
- url (required): Page or video URL
- platform (optional): youtube, tiktok, twitter/x (auto-detected if omitted)

Response:
```json
{
  "input": {
    "url": "https://...",
    "platform": "youtube",
    "title": "...",
    "description": "..."
  },
  "claims": [ { "text": "..." } ],
  "matches": [],
  "heuristics": {
    "score": 42,
    "reasons": [ { "label": "Numbers/statistics mentioned", "weight": 12 } ],
    "features": { "sensational_terms": 1, "numbers": 4, "unknown_domains": 0 }
  }
}
```

### (Deprecated) /analyze

Submit a video for analysis.

**Request:**
```bash
curl -X POST http://localhost:8000/analyze \
  -F "url=https://youtube.com/watch?v=..." \
  -F "language=fr"
```

Or with file upload:
```bash
curl -X POST http://localhost:8000/analyze \
  -F "file=@video.mp4" \
  -F "language=fr"
```

**Parameters:**
- `url` (optional): YouTube URL
- `file` (optional): Video file (.mp4, .avi, .mov)
- `platform` (optional): youtube, tiktok, instagram (auto-detected from URL)
- `language` (default: "fr"): fr, en, es, de

**Response:**
```json
{
  "job_id": "uuid-string"
}
```

### (Deprecated) /status/{job_id}

Get analysis job status.

**Response:**
```json
{
  "status": "queued|running|done|failed",
  "progress": 75,
  "message": "Matching fact-checks..."
}
```

### (Deprecated) /report/{job_id}

Get full analysis report.

**Response:**
```json
{
  "job_id": "string",
  "input": {
    "source": "url|upload",
    "platform": "youtube|tiktok|instagram",
    "url": "string|null",
    "filename": "string|null"
  },
  "meta": {
    "duration_sec": 120.0,
    "fps": 30.0,
    "created_at": "2024-01-01T12:00:00Z"
  },
  "asr": [
    {
      "start": 0.0,
      "end": 2.3,
      "text": "Bonjour et bienvenue..."
    }
  ],
  "ocr_samples": [
    {
      "ts": 7.2,
      "text": "En exclusivité..."
    }
  ],
  "scenes": [
    {
      "start": 0.0,
      "end": 3.1
    }
  ],
  "claims": [
    {
      "ts": 7.2,
      "text": "Les impôts ont augmenté de 300%"
    }
  ],
  "risk": {
    "score": 72,
    "reasons": [
      {
        "label": "Unsourced numbers and statistics",
        "weight": 15
      }
    ],
    "features": {
      "cut_density": 4.2,
      "sensational_terms": 5,
      "fullscreen_text": 8,
      "unsourced_numbers": 12
    }
  },
  "sources": [
    {
      "title": "Faux: les impôts n'ont pas augmenté de 300%",
      "url": "https://...",
      "text": "Les données de l'INSEE...",
      "similarity": 0.85
    }
  ],
  "timelines": [
    {
      "ts": 14.0,
      "flags": ["Potential risk detected"],
      "excerpt": "Les impôts ont explosé..."
    }
  ]
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

### GET /method-card

Get ethics, limitations, and methodology information.

**Response:**
```json
{
  "title": "InfoVerif — Methode & Limitierungen",
  "method": {
    "overview": "Video-Analyse zur Ermittlung potentieller Falschinformationen",
    "components": [
      "ASR (Automatic Speech Recognition)",
      "OCR zur Erkennung von On-Screen-Text",
      "Heuristische Risikobewertung",
      "Matching mit Faktencheck-Datenbank"
    ]
  },
  "limits": {
    "false_positives": "Hohe Rate falsch positiver Ergebnisse",
    "no_automated_scraping": "TikTok/Instagram erfordern manuelles Upload",
    "48h_retention": "Alle Daten nach 48h gelöscht",
    "heuristic_only": "Keine ML-verifizierte Klassifizierung"
  },
  "ethics": {
    "data_minimization": "Nur user-submitted content",
    "no_tracking": "Keine persistenten Profile",
    "transparency": "Offene Dokumentation"
  }
}
```

## Example Request (Lite)
```bash
curl -X POST "$BASE_URL/analyze-lite" -F "url=https://youtube.com/watch?v=..."
```

## Rate Limits

None (MVP). Implement rate limiting for production.

## Error Handling

All errors return JSON:

```json
{
  "detail": "Error message"
}
```

Common status codes:
- `400`: Bad request (missing parameters)
- `404`: Job not found
- `500`: Internal server error

## Data Retention

- All video data: 48 hours
- Reports: 48 hours
- Metadata: 48 hours

Set via `PURGE_AFTER_HOURS` environment variable.

