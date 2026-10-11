# NBO Check Writer — Project Documentation

This folder contains the baseline documentation for the NBO Check Writer Windows desktop application.

## Document order and authority

1. `PROJECT_SPECIFICATION.md` — product scope and acceptance criteria.
2. `TECHNICAL_ARCHITECTURE.md` — application structure and technology decisions.
3. `CHEQUE_PRINTING_SPECIFICATION.md` — printing behaviour and physical calibration.
4. `UI_UX_SPECIFICATION.md` — screens and interaction requirements.
5. `SECURITY_AND_PRIVACY.md` — desktop security and local data handling.
6. `TESTING_AND_RELEASE.md` — quality gates and installer release process.
7. `AI_DEVELOPMENT_RULES.md` — rules for AI coding agents.

If documents conflict, stop and report the conflict rather than guessing. Product requirements and confirmed client decisions take precedence over assumptions in implementation notes.

## Current project baseline

- Product: NBO Check Writer
- Intended environment: Windows desktop
- Primary job: print user-entered cheque details onto physical National Bank of Oman cheques
- Proposed stack: React, TypeScript, Vite, Electron, and electron-builder
- Offline-first: core data entry, conversion, preview, and printing should work without internet
- Backend: not required for the initial release unless a confirmed requirement changes this
- Cheque measurements and field coordinates: **not yet confirmed**
- Exact cheque variants and supported printer models: **not yet confirmed**

## Before production printing

Obtain a blank cheque sample or an approved, non-sensitive scan, measure it, confirm the cheque variant, and validate alignment using the target printer. Never use invented dimensions or coordinates as production values.
