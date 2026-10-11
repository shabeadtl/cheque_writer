# Project Specification

## 1. Purpose

Build a reliable Windows desktop application that helps an authorised company user enter cheque details and print selected fields onto a physical National Bank of Oman (NBO) cheque.

The application prints onto pre-printed bank cheque stock. It does not create a negotiable cheque image, initiate a bank transfer, or communicate with NBO banking systems.

## 2. Users

- Company staff authorised to prepare cheques.
- An administrator or designated user who configures cheque layout and printer settings.

Roles are operational descriptions only. Authentication and role-based access are out of scope unless the client confirms they are required.

## 3. MVP scope

### Required

- Payee/beneficiary name.
- Cheque date with clear date-format handling.
- Amount in Omani Rial (OMR).
- Correct amount-to-words conversion including baisa.
- Live cheque print preview.
- Configurable field visibility and positions.
- Printer selection through the desktop environment.
- Test print on ordinary paper.
- Calibration controls for horizontal and vertical offsets.
- Print confirmation and clear error feedback.
- Local persistence for non-sensitive preferences.
- Windows installer package.
- Offline operation for core workflows.
- Automated tests for monetary conversion and formatting.

### Out of scope unless approved

- Bank account connectivity or bank APIs.
- Online payments or cheque clearing.
- Cloud synchronisation or shared database.
- Bulk cheque issuance.
- User management and remote administration.
- Saving full cheque images or sensitive transaction histories.
- Digital signatures or signature capture.
- Claims of official NBO certification or endorsement.

## 4. Functional requirements

### FR-01 — Entry and validation
The user can enter required cheque fields. Invalid, empty, or unsupported values are identified before printing.

### FR-02 — Currency
The currency is OMR. Monetary calculations must avoid binary floating-point errors. Define supported precision and rounding behaviour explicitly and test it.

### FR-03 — Amount in words
The application converts the entered amount into words using a dedicated, tested utility. Currency wording and formatting must be configurable if the client requires a particular convention. Confirm the exact English/Arabic wording with the client.

### FR-04 — Preview
The preview reflects the selected fields, entered values, font settings, and current layout configuration. Screen zoom must not alter physical print measurements.

### FR-05 — Layout calibration
A designated user can adjust individual field positions and typography. Changes can be saved and restored to a known baseline.

### FR-06 — Printing
The application prints only selected cheque fields using the chosen printer and configured layout. It must not claim accurate alignment until verified on the target printer and cheque stock.

### FR-07 — Offline use
Entry, conversion, preview, saved local settings, and printing must not depend on an internet connection.

### FR-08 — Installer
A reproducible build process creates a Windows installer. The application name, version, icon, and publisher information are configurable.

## 5. Non-functional requirements

- Secure Electron configuration.
- Predictable and repeatable print layout.
- Clear validation and actionable errors.
- Keyboard-accessible forms and controls.
- Maintainable TypeScript modules with strict typing.
- No secrets embedded in the renderer or source repository.
- No unnecessary collection or retention of cheque data.
- Unit tests and a documented manual print-validation procedure.

## 6. Acceptance criteria

The MVP is accepted when:
1. A user can enter valid cheque details and preview the result.
2. OMR amount conversion passes agreed test cases.
3. Field positions and print toggles behave consistently.
4. A test print can be compared with the preview and adjusted.
5. Physical alignment is verified on the client's approved cheque variant and target printer.
6. The installer installs and launches on the agreed Windows version(s).
7. Core workflows function offline.
8. Security, test, and release checks in the project documentation pass.

## 7. Open client decisions

- Exact NBO cheque variant(s): personal, business/corporate, or both.
- Windows versions and CPU architectures to support.
- Required print language(s): English, Arabic, or both.
- Required wording for OMR and baisa.
- Required date format and calendar conventions.
- Printer models and connection types.
- Whether payee presets or cheque history are required.
- Whether installer code signing and managed IT deployment are required.
- Whether cheque layouts are allowed to be edited by every user or only a designated administrator.
