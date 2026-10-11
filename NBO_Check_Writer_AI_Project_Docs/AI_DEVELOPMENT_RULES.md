# AI Development Rules — Antigravity

## 1. Source of truth

Before making changes, read:
1. `README.md`
2. `PROJECT_SPECIFICATION.md`
3. `TECHNICAL_ARCHITECTURE.md`
4. `CHEQUE_PRINTING_SPECIFICATION.md`
5. `UI_UX_SPECIFICATION.md`
6. `SECURITY_AND_PRIVACY.md`
7. `TESTING_AND_RELEASE.md`

Treat these documents as project constraints. If requirements conflict or a key fact is missing, report the issue and ask for clarification rather than silently choosing.

## 2. Work incrementally

For each task:
1. Inspect the existing repository and relevant files.
2. Summarise the intended change and affected modules.
3. Implement the smallest complete change.
4. Add or update tests.
5. Run the relevant checks.
6. Report files changed, checks run, results, and remaining risks.

Do not rewrite working architecture without a concrete reason.

## 3. Do not invent bank-specific details

Never fabricate:
- NBO cheque dimensions.
- Field coordinates.
- Official bank requirements or approvals.
- Required currency wording.
- Printer compatibility results.
- Client acceptance.

Mark unknown values as `UNVERIFIED` and identify the exact evidence needed to resolve them.

## 4. Money correctness

- Use exact integer/minor-unit or decimal-safe arithmetic.
- Never rely on ordinary floating-point arithmetic for monetary calculations.
- Do not silently round unsupported input.
- Add boundary tests for every conversion change.
- Do not change approved amount-in-words wording without documenting the reason and expected output.

## 5. Printing correctness

- Keep physical print coordinates separate from preview zoom and responsive layout.
- Centralise layout values in a versioned profile.
- Do not hardcode field coordinates across multiple components.
- Preserve test-print and confirmation safeguards.
- Never state that physical alignment is verified unless an actual test was performed and recorded.

## 6. Security

- Preserve Electron isolation settings.
- Never enable renderer Node integration as a shortcut.
- Do not expose generic IPC, filesystem, or command-execution capabilities.
- Do not add network services, analytics, telemetry, or cloud persistence without approval.
- Do not log cheque data or commit real cheque samples.
- Do not hardcode credentials or signing secrets.

## 7. Dependencies and scope

- Inspect current dependencies before adding new ones.
- Avoid unnecessary packages and unrelated refactors.
- Do not introduce a backend or database for the MVP without an approved requirement.
- Keep changes compatible with the supported Windows target.

## 8. Completion report

Every implementation task must end with:
- Summary of implemented behaviour.
- Files/modules changed.
- Tests and commands run, with actual results.
- Build/package status.
- Unverified requirements and blockers.
- Manual steps needed from the developer, client, or printer tester.

Never report a test, build, installer, or physical print as successful unless it was actually verified.
