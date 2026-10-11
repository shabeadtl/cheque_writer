# Security and Privacy

## 1. Principles

- Offline-first operation.
- Data minimisation.
- No bank connectivity in the MVP.
- No unnecessary collection, telemetry, or transmission of cheque details.
- Clear separation between renderer UI and privileged desktop functionality.

## 2. Sensitive data

Cheque payee names and amounts may be confidential company information. By default:
- Keep current form data in memory.
- Persist only approved non-sensitive settings.
- Do not store complete cheque history unless explicitly requested and approved.
- Do not save cheque images, bank credentials, account numbers, or signatures.
- Do not include cheque data in logs, crash reports, analytics, or error messages.

## 3. Electron safeguards

- Enable context isolation.
- Disable Node integration in the renderer.
- Expose only narrowly scoped, typed preload methods.
- Validate every IPC request in the main process.
- Do not expose arbitrary command execution, filesystem access, or generic IPC.
- Use a restrictive Content Security Policy.
- Do not load remote content or execute remotely supplied code.
- Keep Electron and dependencies patched.

## 4. Printing safeguards

- Display a preview and selected printer before printing.
- Require explicit print confirmation.
- Never auto-print on app launch or form submission.
- Prevent test guides from printing in real-cheque mode.
- Warn if the active layout is not approved.
- Do not claim physical success merely because a print job was submitted.

## 5. Updates and distribution

- Distribute installers through an approved company channel.
- Prefer a code-signed installer where the company can provide valid signing credentials.
- Verify release artifacts and publish version/checksum information through the company's chosen process.
- Do not embed signing certificates, private keys, or passwords in the repository.
- Define update delivery and approval policy before implementing auto-update.

## 6. Incident and deletion considerations

If local history is introduced, document how to view, export, and delete it, who can access it, and how backups are handled. Do not add history by default.
