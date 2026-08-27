# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.2] - 2026-08-27

### Fixed
- Moved `typescript` to runtime `dependencies` ensuring standalone execution via `npx` and global installs without missing module errors.

### Added
- Native GitHub SARIF Code Scanning workflow (`.github/workflows/sarif.yml`).
- Official MIT `LICENSE` file.
- Bilingual documentation (`README.es.md` and `CHANGELOG.es.md`).

## [1.1.1] - 2026-08-27

### Added
- Added official Git Hooks integration guide (Husky) in `README.md` for local pre-commit validations.

## [1.1.0] - 2026-08-27

### Added
- **Semantic Auditing (TypeChecker):** Detection of implicit "Invisible `any`" in variables originating from functions returning `any` (e.g., `JSON.parse`).
- **Deep AST Hunting:**
  - Detection of poisoned function parameters (`function(data: any)`).
  - Detection of leaky return types (`(): any => {}`).
  - Detection of disguised generics (`Promise<any>`).
- Strict severity classification (`error` for return types and parameters, `warning` for local variables).

## [1.0.0] - 2026-08-27

Stable 1.0.0 release. Any-Hunter is now a comprehensive, enterprise-ready type-health auditor.

### Added
- **Initialization Wizard (`--init`):** Automatically scaffolds a base `.anyhunterrc.json` configuration file.
- **SARIF Output (`--sarif`):** Support for exporting reports in standard SARIF format for native integration with GitHub *Security / Code Scanning*.
- **Inline Suppressions (`// any-hunter-disable-next-line`):** Ability to bypass linter checks on specific lines for justified exceptions.

## [0.9.0] - 2026-08-27

### Added
- Official GitHub Action integration (`action.yml`). Allows using `uses: JacobPalomo/any-hunter@v0.9.0` in CI/CD workflows.

## [0.8.0] - 2026-08-27

### Added
- Programmatic entry point (`src/api.ts` -> `dist/api.js`) to consume `any-hunter` as a Node.js library.
- TypeScript declaration exports (`dist/api.d.ts`) and `exports` map configuration in `package.json`.
- Unit tests validating programmatic API exports.

## [0.7.0] - 2026-08-27

### Added
- Support for configuration files (`.anyhunterrc.json`, `.anyhunterrc`, `anyhunter.config.json`).
- `--config=path` flag to specify custom configuration file paths.
- Automatic merging of exclusion patterns and thresholds between configuration files and CLI flags.

## [0.6.0] - 2026-08-27

### Added
- Support for GitHub Actions Step Summary (`$GITHUB_STEP_SUMMARY`), rendering visual Markdown reports with metric tables and issue breakdowns directly in workflow summaries.

## [0.5.0] - 2026-08-27

### Added
- `--exclude` flag to ignore files and directories using glob patterns (e.g., `--exclude="*.test.ts,src/legacy/**"`).
- Helper function `isExcluded` with wildcard support (`*`, `**`, `?`) and zero external dependencies.
- Excluded file count metrics in terminal and JSON outputs.

## [0.4.0] - 2026-08-27

### Added
- `--json` flag to export analysis results and metrics in structured JSON format.
- ANSI color and terminal decoration suppression when JSON mode is active.

## [0.3.0] - 2026-08-27

### Added
- Non-null assertion operator (`!`) detection to prevent runtime errors caused by `null` or `undefined` values.
- Direct forced type assertion detection (`expr as any`).
- Unit tests covering newly introduced AST inspection rules.

## [0.2.0] - 2026-08-27

### Added
- Native integration with GitHub Actions Annotations (`::error::` and `::warning::`) to highlight issues directly on Pull Requests.
- CI environment variable detection.

---

## [0.1.0] - 2026-08-27

### Added
- Static analysis engine built on TypeScript's AST Compiler API.
- Explicit `any` usage detection.
- Forced double casting detection (`as any as T` and `as unknown as T`).
- Trivia comment suppression directive detection (`@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`).
- Weighted **Type-Health Score** metric calculation normalized against Lines of Code (LOC).
- Command Line Interface (CLI) with ANSI color formatting and dynamic alignment.
- CLI flag support including `--threshold=N`.
- Native unit test suite powered by `node:test`.
- Automated Continuous Integration (CI) pipeline with GitHub Actions.
