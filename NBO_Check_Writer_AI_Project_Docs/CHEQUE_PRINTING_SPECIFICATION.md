# Cheque Printing Specification

## 1. Purpose and critical constraint

Printing accuracy is the primary product risk. This document defines the behaviour and verification process; it does **not** contain approved NBO cheque measurements.

Never invent the cheque width, height, margins, field coordinates, or printer offsets. Keep unverified values clearly marked as placeholders and block production-ready claims until physical verification is complete.

## 2. Required reference material

Before finalising the layout, obtain:
- Exact cheque variant and stock type.
- A blank, unused cheque or client-approved scan.
- Physical width and height, measured in millimetres.
- Positions and extents of all fields to be overprinted.
- Required print language and amount-in-words convention.
- Target printer model, driver, connection, paper source, and settings.
- Confirmation of which fields must be printed and which must remain pre-printed or handwritten.

Treat cheque scans and samples as confidential. Avoid committing real cheque images to source control.

## 3. Data fields

Potential fields, subject to client confirmation:
- Payee/beneficiary.
- Date.
- Amount in figures.
- Amount in words.
- Optional crossing text, such as account-payee wording, only if required.

Each field must have:
- Enabled/disabled print state.
- X and Y position in physical units.
- Font family and size.
- Alignment and any required wrapping rules.
- A maximum supported length or an explicit overflow strategy.

Do not silently shrink text or clip content without a visible warning and an agreed policy.

## 4. Money handling

- Currency: OMR.
- Handle baisa with exact decimal/integer arithmetic.
- Parse user input explicitly; reject ambiguous formats.
- Define accepted decimal separator and grouping rules.
- Avoid JavaScript floating-point arithmetic for monetary conversion.
- Specify whether unsupported precision is rejected or rounded; never round silently.
- Test zero, minimum unit, whole rials, baisa fractions, carry boundaries, large values, negative values, and malformed input.
- Confirm the exact wording for singular/plural currency units and the representation of zero baisa with the client.

## 5. Physical layout model

- Store the approved cheque dimensions and field coordinates in a dedicated versioned layout profile.
- Use physical units such as millimetres for print coordinates.
- Do not derive print coordinates from the current viewport or screen pixels.
- Preview zoom is visual only and must not change output geometry.
- Support calibration offsets without mutating the approved base template.
- Record layout profile version and provide a reset-to-approved-default action.
- Account for the printer's non-printable area and paper-feed variability.

## 6. Print workflow

1. Validate required fields and amount.
2. Render a preview using the active layout profile.
3. Show the selected printer and relevant print settings.
4. Require explicit user confirmation.
5. Print only the selected fields.
6. Report success/failure based on what the platform can actually confirm; do not imply that ink physically landed correctly.
7. Offer test-print guidance when the printer or layout changes.

A normal-paper test should use a clearly marked test mode. Never let test labels or guides print onto a real cheque.

## 7. Calibration procedure

1. Use a blank test page and a reference outline or calibration marks.
2. Match the paper size and feed direction used for the cheque.
3. Print at 100% scale with unwanted headers, footers, and fit-to-page scaling disabled where possible.
4. Overlay the test sheet against the cheque using safe light/overlay methods.
5. Adjust X/Y offsets in small increments.
6. Repeat for each supported printer/paper-feed combination.
7. Test every field, longest expected payee, date, and amount-in-words line.
8. Save and identify the verified profile.
9. Repeat after changing printer, driver, paper source, scaling, or cheque stock.

Do not test with a signed, completed, or negotiable cheque. Follow the client's handling procedure for cheque stock.

## 8. Physical verification record

For every approved combination, record:
- Cheque variant and layout version.
- Printer make/model and driver version.
- Windows version.
- Paper source and relevant driver settings.
- Date and tester.
- Field-by-field alignment result.
- Known limitations and approval status.

Status values: `UNVERIFIED`, `TESTED`, `APPROVED`. Only the client's designated approver can mark a layout `APPROVED`.

## 9. Release blocker

The NBO layout is not production-ready until the client has approved the exact field mapping and physical print results on the intended cheque stock and printer.
