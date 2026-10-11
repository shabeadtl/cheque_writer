# Release Process

This document outlines the procedure for building and packaging the NBO Check Writer application for production distribution.

## Prerequisites

- A Windows machine (or a Windows VM) is required to build the Windows `.exe` installer.
- Node.js installed (v18+ recommended).
- A valid NBO cheque and physical printer (for verifying calibration before signing off on a release).

## Building the Installer

The application is packaged using `electron-builder` which compiles the React app, bundles the Electron main process, and generates an NSIS installer.

1. **Install dependencies:**
   Ensure all dependencies are installed.
   ```bash
   npm install
   ```

2. **Run tests:**
   All tests (especially the `amount-to-words` converter) MUST pass before release.
   ```bash
   npm run test
   ```

3. **Build the installer:**
   This command compiles the TypeScript/React code and triggers electron-builder.
   ```bash
   npm run electron:build
   ```

4. **Retrieve the Installer:**
   Once the build process completes, the installer will be located in the `release/` directory.
   - File: `release/<version>/NBO Check Writer Setup <version>.exe`

## Versioning

Update the application version in `package.json` prior to a release.

```json
{
  "name": "nbo-check-writer",
  "version": "1.0.1",
  ...
}
```
The version number is automatically injected into the React application via the Preload API and displayed in the header.

## Future Enhancements (Code Signing)

Currently, the installer is unsigned, meaning Windows SmartScreen may display a warning when users attempt to run the `.exe`. 
For a production rollout across a corporate environment, you must sign the executable.

To enable code signing, update `electron-builder.yml`:
```yaml
win:
  target: nsis
  certificateFile: path/to/certificate.pfx
  certificatePassword: your-password
```
Alternatively, configure the `CSC_LINK` and `CSC_KEY_PASSWORD` environment variables in your CI/CD pipeline.
