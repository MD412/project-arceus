'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import { Button } from '@/components/ui/Button';

export default function WindowsTerminalPage() {
  return (
    <PageLayout
      title="Windows Terminal & PowerShell Patterns"
      description="Essential patterns for Windows development with Cursor AI to avoid OS-specific pitfalls."
    >
      <ContentSection title="⚠️ Critical Windows Issues" headingLevel={2}>
        <div className="alert alert-warning">
          <p className="body-medium">
            <strong>Cursor AI has OS detection issues</strong> and defaults to Unix-style commands even on Windows. This causes:
          </p>
          <ul className="list-disc pl-6 body-medium space-y-2 mt-2">
            <li>Commands chained with <code>&&</code> (fails in PowerShell)</li>
            <li>Unix paths instead of Windows paths</li>
            <li>Bash syntax instead of PowerShell</li>
            <li>Context window exhaustion from retry loops</li>
          </ul>
        </div>
      </ContentSection>

      <ContentSection title="🛡️ Defensive Patterns" headingLevel={2}>
        <h3 className="heading-4 mt-4">1. Script-Based Execution (Recommended)</h3>
        <p className="body-medium">
          Instead of direct terminal commands, create PowerShell scripts in <code>scripts/</code>:
        </p>
        <pre className="code-block">
{`# scripts/run-worker.ps1
<#
.SYNOPSIS
    Starts the Python worker for card processing
.DESCRIPTION
    Activates virtual environment and starts the worker process
#>

# Navigate to project root
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

# Activate virtual environment if exists
if (Test-Path ".venv\\Scripts\\Activate.ps1") {
    & .venv\\Scripts\\Activate.ps1
}

# Start worker
python worker/worker.py`}
        </pre>

        <h3 className="heading-4 mt-4">2. Always Specify PowerShell Syntax</h3>
        <p className="body-medium">In your Cursor rules or when prompting:</p>
        <pre className="code-block">
{`# Add to .cursorrules or prompt
"I'm on Windows. Use PowerShell syntax:
- Use ; to chain commands, not &&
- Use $env:VAR not $VAR
- Use \\ for paths, not /
- Wrap complex commands in .ps1 scripts"`}
        </pre>

        <h3 className="heading-4 mt-4">3. Common Command Translations</h3>
        <table className="handbook-table">
          <thead>
            <tr>
              <th>Unix/Bash</th>
              <th>PowerShell</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>cd dir && npm install</code></td>
              <td><code>cd dir; npm install</code></td>
              <td>Use semicolon for command chaining</td>
            </tr>
            <tr>
              <td><code>export VAR=value</code></td>
              <td><code>$env:VAR="value"</code></td>
              <td>Environment variables</td>
            </tr>
            <tr>
              <td><code>source .env</code></td>
              <td><code>. .env.ps1</code></td>
              <td>Dot sourcing scripts</td>
            </tr>
            <tr>
              <td><code>grep "pattern"</code></td>
              <td><code>Select-String "pattern"</code></td>
              <td>Or use ripgrep: <code>rg</code></td>
            </tr>
            <tr>
              <td><code>rm -rf dir/</code></td>
              <td><code>Remove-Item -Recurse -Force dir</code></td>
              <td>Recursive deletion</td>
            </tr>
          </tbody>
        </table>
      </ContentSection>

      <ContentSection title="📁 Project Script Structure" headingLevel={2}>
        <pre className="code-block">
{`scripts/
├── setup/
│   ├── install-dependencies.ps1    # npm install + pip install
│   ├── configure-environment.ps1    # Set up .env files
│   └── init-database.ps1           # Run migrations
├── dev/
│   ├── start-frontend.ps1          # npm run dev
│   ├── start-worker.ps1            # python worker/worker.py
│   └── start-all.ps1               # Starts everything
├── test/
│   ├── run-frontend-tests.ps1     # Jest/Playwright
│   ├── run-python-tests.ps1       # PyTest
│   └── run-all-tests.ps1          # Full test suite
└── README.md                       # Script documentation`}
        </pre>
      </ContentSection>

      <ContentSection title="🔧 Worker-Specific Issues" headingLevel={2}>
        <p className="body-medium">The Python worker requires special handling on Windows:</p>
        
        <h3 className="heading-4 mt-4">Virtual Environment Activation</h3>
        <pre className="code-block">
{`# Current (complex) way:
.venv\\Scripts\\Activate.ps1; cd worker; python worker.py

# Better: Use a script
./scripts/dev/start-worker.ps1`}
        </pre>

        <h3 className="heading-4 mt-4">Path Issues</h3>
        <p className="body-medium">Always use raw strings or escape backslashes in Python:</p>
        <pre className="code-block">
{`# Bad
path = "C:\\Users\\user\\project"  # Double escaping issues

# Good
path = r"C:\\Users\\user\\project"  # Raw string
path = Path("C:/Users/user/project")  # Forward slashes work`}
        </pre>
      </ContentSection>

      <ContentSection title="🚨 Troubleshooting" headingLevel={2}>
        <h3 className="heading-4">Cursor Hangs on "Generating..."</h3>
        <ul className="list-disc pl-6 body-medium space-y-2">
          <li>Type <code>continue</code> or <code>?</code> to nudge it</li>
          <li>Check if it's stuck on Unix commands</li>
          <li>Create new session if context is corrupted</li>
        </ul>

        <h3 className="heading-4 mt-4">Commands Fail Silently</h3>
        <ul className="list-disc pl-6 body-medium space-y-2">
          <li>Check terminal output for <code>&&</code> errors</li>
          <li>Verify PowerShell is the active shell</li>
          <li>Use <code>$ErrorActionPreference = "Stop"</code> in scripts</li>
        </ul>

        <h3 className="heading-4 mt-4">Database Connection Issues</h3>
        <pre className="code-block">
{`# Windows often needs explicit UTF-8 encoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$env:PYTHONUTF8 = "1"`}
        </pre>
      </ContentSection>

      <ContentSection title="📌 Quick Reference Card" headingLevel={2}>
        <div className="handbook-card">
          <h4 className="heading-5">Every Windows Session Checklist:</h4>
          <ol className="list-decimal pl-6 body-medium space-y-2 mt-2">
            <li>Tell Cursor: "I'm on Windows, use PowerShell syntax"</li>
            <li>Create <code>.ps1</code> scripts instead of inline commands</li>
            <li>Use <code>;</code> not <code>&&</code> for chaining</li>
            <li>Escape backslashes in paths or use forward slashes</li>
            <li>Run <code>ripgrep</code> as <code>rg</code>, not <code>grep</code></li>
          </ol>
        </div>
      </ContentSection>
    </PageLayout>
  );
} 