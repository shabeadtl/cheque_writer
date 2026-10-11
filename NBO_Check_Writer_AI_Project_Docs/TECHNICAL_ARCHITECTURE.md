# Technical Architecture

## 1. Proposed stack

- React + TypeScript + Vite for the renderer UI.
- Electron for the Windows desktop shell and native integration.
- electron-builder for packaging and installer generation.
- Tailwind CSS and shadcn/ui for the interface, if already adopted by the repository.
- Vitest for unit tests; add UI tests where valuable.

Check current project dependencies and versions before adding or upgrading packages. Do not perform broad dependency upgrades without a reason.

## 2. High-level structure

Suggested structure (adapt to the existing repository instead of forcing a rewrite):

```text
src/
  app/                 Application shell and routes/views
  features/
    cheque-form/       Field entry and validation
    cheque-preview/    Screen preview
    printing/          Print orchestration and print state
    calibration/       Layout editor and calibration controls
    settings/          Printer/layout preferences
  domain/
    money/              OMR parsing, validation, amount-to-words
    cheque/             Cheque model and layout types
  infrastructure/
    persistence/        Local settings repository
  styles/
    print.css           Print-specific styling
electron/
  main.ts               Window lifecycle and native printing
  preload.ts            Narrow, typed renderer bridge
```

## 3. Responsibility boundaries

- Domain utilities must not depend on React or Electron.
- UI components must not call unrestricted Node.js APIs.
- Renderer-to-main communication must use a narrow, typed preload API.
- Printer integration belongs in Electron's main process or an explicitly selected, reviewed printing module.
- Layout configuration must be centralised and versioned.
- Persistence should store preferences and layout configuration only by default; cheque records are not stored unless explicitly approved.

## 4. Electron security baseline

- `contextIsolation: true`.
- `nodeIntegration: false`.
- Use a preload script with a minimal allowlisted API.
- Validate IPC arguments in the main process.
- Do not expose arbitrary IPC senders or generic filesystem access to the renderer.
- Apply a restrictive Content Security Policy appropriate to the packaged app.
- Do not load remote pages or execute remote code.
- Keep dependencies maintained and review Electron security advisories.

## 5. Printing approach

Use a dedicated print document or print route with physical-unit layout, normally millimetres, and explicit print CSS. Keep on-screen preview scaling separate from the print coordinate system.

Browser/Electron print output may be affected by printer drivers, printable-area limits, paper settings, and scaling. Do not assume CSS alone guarantees physical accuracy. Validate against the actual printer and cheque stock. If native printer APIs or silent printing are required, evaluate the approach against the client's Windows environment before committing to it.

## 6. Local persistence

Persist only approved settings, such as:
- Selected printer name, if stable and useful.
- Layout profile and calibration offsets.
- UI preferences.

Do not store passwords, bank credentials, signatures, or cheque images. If transaction history is later approved, define retention, deletion, access, and backup requirements first.

## 7. Build and packaging

- Keep renderer and Electron build steps deterministic.
- Use a locked package manager lockfile.
- Separate development and packaged-app configuration.
- Generate an installer with electron-builder.
- Configure app identity, version, icon, publisher, and target architecture.
- Do not claim a code-signed installer unless a valid signing certificate and signed build have been verified.
- Document clean-machine installation and upgrade tests.
