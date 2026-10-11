# UI/UX Specification

## 1. Design goal

Create a focused, professional desktop utility for staff who need to prepare and print cheque details reliably. Prioritise clarity, speed, accessibility, and prevention of accidental printing over decorative visuals.

## 2. Main screen

Recommended desktop layout:
- Left/main area: cheque details form.
- Right/main area: cheque preview.
- Primary action: `Preview / Print`.
- Secondary actions: `Test Print`, `Printer Settings`, `Layout Calibration`.
- Clear active cheque template and printer indicators.
- Visible warning when the layout is unverified.

## 3. Form behaviour

- Labels must be explicit; do not rely on placeholders alone.
- Show OMR currency beside the amount input.
- Update amount-in-words after valid amount changes.
- Display validation next to the relevant field.
- Prevent printing when required fields are invalid.
- Use an unambiguous date format and display it consistently in the preview.
- Avoid clearing entered data unexpectedly.
- Ask for confirmation before actions that could print onto cheque stock.

## 4. Preview

- Clearly distinguish screen preview from physical print output.
- Provide zoom controls that do not change print dimensions.
- Show selected/disabled fields accurately.
- Show a clear unverified-layout warning until physical verification is approved.
- Avoid showing fake NBO branding or invented cheque coordinates.

## 5. Calibration UI

- Allow selection of a field and adjustment of X/Y position.
- Show units (mm) explicitly.
- Allow font size and alignment changes where supported.
- Provide reset-to-approved-default and save/cancel controls.
- Explain that changing printer, driver, paper source, or scaling can invalidate previous calibration.

## 6. Error and safety states

Provide actionable messages for:
- Missing required fields.
- Invalid or unsupported amount.
- Printer unavailable or not selected.
- Print job failure where detectable.
- Unverified or incompatible layout profile.
- Content overflow.
- Unsaved calibration changes.

## 7. Accessibility and interaction

- Keyboard navigation and visible focus.
- Proper input labels and semantic controls.
- Do not communicate errors using colour alone.
- Use sensible tab order and shortcuts only where they do not increase accidental printing risk.
- Confirm printing and other irreversible or high-impact actions.

## 8. Responsive behaviour

Desktop is the primary environment. The layout should still remain usable in smaller windows, but do not let responsive CSS affect physical print geometry.
