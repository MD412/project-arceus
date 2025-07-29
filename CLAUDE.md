# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Project Arceus is a production-ready Pokemon card scanning system with AI-powered identification, autonomous operation, and SaaS-level reliability. It combines Next.js 15 frontend with Supabase backend and a Python worker pipeline featuring YOLO detection, CLIP similarity search, and GPT-4o Mini fallback.

## Core Architecture

- **Frontend**: Next.js 15 with React 19, CSS Modules (no Tailwind), TypeScript
- **Backend**: Supabase (PostgreSQL + Edge Functions + RLS)
- **AI Pipeline**: Python worker with YOLO → CLIP → GPT-4o Mini
- **Design System**: CircuitDS for consistent UI components
- **Testing**: Jest for unit tests, Playwright for E2E tests

## Key Commands

### Development
```bash
npm run dev                 # Start Next.js development server (localhost:3000)
npm run build              # Build production application
npm run start              # Start production server
```

### Testing
```bash
npm test                   # Run Jest unit tests
npm run test:watch         # Jest in watch mode
npm run test:coverage      # Jest with coverage report
npm run test:e2e           # Run Playwright E2E tests
npm run test:ui            # Playwright with UI
npm run test:debug         # Playwright debug mode
```

### Worker System
```bash
py worker/worker.py                      # Main processing worker
py worker/auto_recovery_system.py        # Auto-recovery monitor
py start_production_system.py            # Complete system startup
npm run worker                          # Run worker via npm script
npm run dev-up                          # Start both dev server and worker
```

### Linting & Code Quality
```bash
npm run lint               # Next.js ESLint
```

## Windows Development Notes

This project runs on Windows. Key considerations:
- Use `py` instead of `python` in commands
- PowerShell doesn't support `&&` - use `;` or separate commands
- Avoid Unix-specific shortcuts like `^D`, `^C` suffixes in commands
- Use PowerShell-compatible syntax for all terminal operations

## Architecture Patterns

### AI Vision Pipeline
1. **YOLO Detection**: Locates cards in uploaded images (`worker/worker.py`)
2. **CLIP Similarity**: Fast embedding-based matching using 19k+ embeddings (`worker/clip_lookup.py`)
3. **GPT-4o Fallback**: Premium AI vision for difficult cases (`worker/gpt4_vision_identifier.py`)
4. **Cost Controls**: Daily budget limits, confidence thresholds

### Optimistic CRUD Pipeline
Follow the Factorio-style CQRS pattern documented in `app/(handbook)/handbook/optimistic-crud-pipeline/page.tsx`:
- Command queue for background operations
- Optimistic UI updates
- Proper error handling and rollback

### Auto-Recovery System
Production-ready autonomous job monitoring:
- 30s stuck job detection
- Automatic retry with exponential backoff (max 3 attempts)
- Self-healing worker processes
- Database health monitoring

## File Structure & Key Locations

### Frontend Application
```
app/(app)/                    # Main application pages
├── scans/[id]/              # Scan detail and review pages
├── upload/                  # Card upload interface
└── page.tsx                 # Homepage

app/(circuitds)/circuitds/   # Design system documentation
├── layout.tsx               # DS navigation sidebar
├── components/              # Component documentation
└── README.md                # CircuitDS developer guide

app/(handbook)/handbook/     # System architecture docs
├── patterns/                # Design patterns and conventions
└── worker-pipeline/         # AI pipeline documentation
```

### API Routes
```
app/api/
├── scans/                   # Scan CRUD operations
│   ├── [id]/route.ts       # Individual scan operations
│   └── bulk/route.ts       # Bulk operations
├── cards/search/route.ts    # Card search functionality
└── training/               # ML training feedback
```

### Components & Services
```
components/ui/               # Reusable UI components
├── TradingCard.tsx         # Main card display component
├── ScanHistoryTable.tsx    # Scan management table
└── Button.tsx              # Design system button

services/cards.ts           # Card data service layer
hooks/useCardSearch.ts      # Card search hook
```

### Worker System
```
worker/
├── worker.py               # Main processing worker
├── auto_recovery_system.py # Autonomous job recovery
├── clip_lookup.py          # CLIP similarity search
├── gpt4_vision_identifier.py # GPT-4o Mini integration
└── config.py               # Worker configuration
```

## Design System (CircuitDS)

CircuitDS is the project's design system. When working with UI components:

1. **Check existing tokens**: Review `app/globals.css` for design tokens
2. **Follow component patterns**: Study existing components in `components/ui/`
3. **Document new components**: Add to CircuitDS library in `app/(circuitds)/circuitds/`
4. **Update navigation**: Add new components to `circuitDSNavItems` in `app/(circuitds)/circuitds/layout.tsx`

## Database & Migrations

- **Supabase**: Primary database with Edge Functions
- **Migrations**: Located in `supabase/migrations/`
- **Key tables**: scans, scan_results, embeddings, job_queue_health
- **Auto-recovery**: `auto_recovery_migration.sql` for production monitoring

## Testing Strategy

### Unit Tests (Jest)
- Configuration: `jest.config.js`
- Setup: `jest.setup.js`
- Location: `__tests__/**/*.test.[jt]s?(x)`
- Run individual test: `npm test -- --testNamePattern="test name"`

### E2E Tests (Playwright)
- Configuration: `playwright.config.ts`
- Location: `tests/`
- Multiple browsers: Chrome, Firefox, Safari, Mobile
- Reports: `playwright-report/`

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# OpenAI (for GPT-4o Mini)
OPENAI_API_KEY=your_openai_key

# Optional: Hugging Face
HUGGING_FACE_TOKEN=your_hf_token

# Worker Configuration
ENABLE_GPT_FALLBACK=true    # Enable/disable GPT-4o fallback
```

## Cost Management

- **CLIP-first approach**: 80%+ confidence → immediate identification
- **GPT fallback**: Only for low-confidence cases (<80%)
- **Daily budgets**: Built-in cost controls in worker
- **Performance metrics**: $0.0004/card average cost

## Common Development Tasks

### Adding New Card Detection Features
1. Extend `worker/clip_lookup.py` for embedding improvements
2. Update `worker/gpt4_vision_identifier.py` for GPT integration
3. Modify scan result handling in `app/api/scans/[id]/route.ts`

### UI Component Development
1. Create component in `components/ui/`
2. Add styles using CSS Modules and design tokens
3. Document in CircuitDS (`app/(circuitds)/circuitds/components/`)
4. Update navigation sidebar

### Database Schema Changes
1. Create migration in `supabase/migrations/`
2. Test locally with Supabase CLI
3. Update TypeScript types if needed
4. Document breaking changes

## Production Deployment

The system is designed for production with:
- Autonomous operation and self-healing
- 99.9%+ uptime with auto-recovery
- Real-time monitoring and health checks
- Cost optimization and performance tracking

For production issues, check:
1. Worker logs in `worker/logs/`
2. Database health: `SELECT * FROM job_queue_health;`
3. Auto-recovery status: `SELECT * FROM get_stuck_jobs();`