# AI Post Builder

Generate optimized social media posts for multiple platforms using Anthropic's Claude AI.

## Features

- **Multi-platform generation** — Twitter/X, LinkedIn, Instagram, Facebook
- **Multi-model support** — Claude Haiku, Sonnet, Opus
- **Video analysis** — Upload a video; 6 frames extracted client-side and analyzed via Claude Vision to auto-fill topic & keywords
- **Inline editing** — Edit any post with live character counter and progress bar
- **Regenerate single posts** — Re-run Claude for one platform without touching others
- **Session history** — Auto-saves last 10 sessions to localStorage; restore or delete anytime
- **Export** — Download all posts as a formatted `.txt` file
- **Image prompts** — Generate image prompts for any post via Claude
- **Structured metadata** — Sentiment, key topics, call-to-action, hashtags, mentions per post

## Tech Stack

| Layer | Tools |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4 |
| Backend | Express 4, tRPC 11 |
| Database | SQLite (dev) / MySQL-TiDB (prod) via Drizzle ORM |
| AI | Anthropic Claude API |
| Testing | Vitest |

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
# Add ANTHROPIC_API_KEY and optionally DATABASE_URL

# 3. Run dev servers (client + server)
pnpm dev
```

Client → http://localhost:3000  
Server → http://localhost:3001

## Platform Specifications

| Platform | Char Limit | Hashtags | Emojis | Links |
|---|---|---|---|---|
| Twitter/X | 280 | ✓ | ✓ | ✓ |
| LinkedIn | 3,000 | ✓ | — | ✓ |
| Instagram | 2,200 | ✓ | ✓ | — |
| Facebook | 63,206 | — | ✓ | ✓ |

## API Reference

All endpoints via tRPC at `/trpc`:

| Procedure | Type | Description |
|---|---|---|
| `posts.generate` | mutation | Generate posts for selected platforms |
| `posts.regenerate` | mutation | Regenerate one platform post |
| `video.analyzeVideo` | mutation | Analyze video frames via Claude Vision |
| `image.generateImage` | mutation | Generate image prompt for a post |

## Development

```bash
pnpm test        # Run Vitest tests
pnpm check       # TypeScript type check
pnpm build       # Production build
pnpm db:push     # Push schema to database
pnpm db:studio   # Open Drizzle Studio
```

## License

[Mozilla Public License 2.0](LICENSE)
