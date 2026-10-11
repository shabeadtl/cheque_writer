# Testing and Release

## 1. Quality gates

Before a release:
- TypeScript checks pass.
- Lint passes.
- Unit tests pass.
- Production renderer build passes.
- Electron package build passes.
- Installer installs and launches on a clean supported Windows environment.
- Offline operation is tested.
- Printing is verified against the approved cheque/printer combinations.
- No secrets or real cheque samples are included in the release bundle or repository.

## 2. Automated tests

### Money and amount-in-words
Test:
- Zero amount.
- One rial and currency pluralisation.
- Baisa boundaries and carry into rials.
- Values with trailing zeros.
- Maximum supported amount.
- Negative values.
- Excess decimal places.
- Commas, spaces, invalid characters, and ambiguous separators.
- Exact expected English/Arabic output where those languages are supported.

### Form and preview
- Required-field validation.
- Date formatting.
- Print toggle behaviour.
- Long payee and amount-in-words overflow.
- Preview updates when data or layout changes.
- Preview zoom does not change stored coordinates.

### Layout and printing
- Coordinates are interpreted consistently in physical units.
- Calibration offsets are applied only to the intended profile.
- Disabled fields are not printed.
- Unverified layout warning is visible.
- Printer failures produce clear feedback where detectable.

## 3. Manual verification matrix

Test at minimum:
- Every supported Windows version.
- Every approved printer model and paper-feed path.
- Correct paper size and orientation.
- Scaling set to actual size/100%.
- Each supported cheque variant.
- Normal-paper alignment test.
- Physical cheque alignment with authorised test stock.
- Long and short payee names.
- Date and amount edge cases.
- Offline launch and printing.

A layout is approved only after the client's designated person accepts the physical results.

## 4. Installer validation

- Confirm application name, icon, version, and publisher metadata.
- Install as a standard user where supported by company policy.
- Verify shortcuts and uninstall behaviour.
- Verify no developer server or internet connection is required.
- Check app data and settings locations.
- Test upgrade behaviour if upgrades are supported.
- Confirm signing status accurately; unsigned builds must not be described as signed.
- Scan the release artifact according to company IT policy.

## 5. Release checklist

- [ ] Requirements and open decisions reviewed.
- [ ] Approved cheque layout profile included.
- [ ] Automated checks passed.
- [ ] Installer built from a clean, reproducible checkout.
- [ ] Clean-machine install passed.
- [ ] Offline workflow passed.
- [ ] Physical printing approved for the declared matrix.
- [ ] Known limitations documented.
- [ ] Version and release notes updated.
- [ ] Artifact distributed through the approved company channel.
