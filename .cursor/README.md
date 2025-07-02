# Cursor Configuration for Project Arceus

This folder contains Cursor-specific configurations and scripts for the Project Arceus card detection system.

## Files

### `mcp.json`
MCP (Model Context Protocol) server configurations:
- **Supabase**: Database management and queries
- **Figma**: Design system integration (requires token)

### Worker Scripts

#### `run-worker.sh` (GitBash/Linux/macOS)
Bash script to run the Python worker properly with environment validation.

Usage:
```bash
npm run worker
# OR
bash .cursor/run-worker.sh
```

#### `run-worker.bat` (Windows)
Windows batch script that calls GitBash to run the worker.

Usage:
```cmd
npm run worker-windows
# OR
.cursor\run-worker.bat
```

## Why GitBash for the Worker?

The Python worker requires:
- Proper Unix-style path handling
- Environment variable management
- Better process control

PowerShell can have issues with these, so we use GitBash for reliability.

## Quick Start

1. **Start Next.js dev server:**
   ```bash
   npm run dev
   ```

2. **Start the worker (in a separate terminal):**
   ```bash
   npm run worker
   ```

3. **Or run both together:**
   ```bash
   npm run dev-up
   ```

## Troubleshooting

- **"GitBash not found"**: Install Git for Windows
- **"Model file not found"**: Ensure `worker/pokemon_cards_trained.pt` exists
- **"Config file not found"**: Ensure `worker/config.py` exists and environment variables are set 