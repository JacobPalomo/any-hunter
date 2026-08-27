<div align="center">

# 🎯 any-hunter

**Zero-dependency AST & Semantic Type-Health Auditor for TypeScript**

[![CI & Type Health Audit](https://github.com/JacobPalomo/any-hunter/actions/workflows/ci.yml/badge.svg)](https://github.com/JacobPalomo/any-hunter/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://github.com/JacobPalomo/any-hunter)

[English](README.md) | [Español](README.es.md)

<p align="center">
  Stop type erosion before it hits production. Any-Hunter analyzes your AST and uses the TypeScript compiler's TypeChecker to calculate a real-time <b>Type-Health Score (0–100)</b>, hunt down invisible <code>any</code>s, and enforce quality gates in your CI/CD pipelines.
</p>

</div>

---

## ✨ Features

- 🔍 **Deep AST Inspection:** Zero regex on source code; parses actual syntax trees via TypeScript's Compiler API.
- 🧠 **Semantic Analysis (TypeChecker):** Catches "Invisible `any`s" inferred from unvalidated calls like `JSON.parse()` or untyped third-party packages.
- 🪝 **Context-Aware Penalties:** Treats poisoned function parameters and leaky return types with higher severity than localized variables.
- 💬 **Trivia Directive Auditing:** Identifies compiler bypass comments (`@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`).
- 🛑 **Forced Double Casting Detection:** Blocks unsafe type escape hatches (`as any as T`, `as unknown as T`).
- 📊 **Quantified Type-Health Score:** Weighted score (0 to 100) normalized against your project's total Lines of Code (LOC).
- 🛡️ **SARIF & GitHub Step Summaries:** Native integration with GitHub Code Scanning (Security tab) and CI job summaries without extra plugins.
- ⚡ **Zero Runtime Dependencies:** Ultra-fast, lightweight, and completely self-contained.

---

## 🚀 Quick Start

### 1. Initialize Configuration (Recommended)

Generate a pre-configured `.anyhunterrc.json` in your repository:

```bash
npx any-hunter --init
```

### 2. Run Audit

Audit your default `./tsconfig.json`:

```bash
npx any-hunter
```

Or target a specific project with a minimum score threshold:

```bash
npx any-hunter ./apps/api/tsconfig.json --threshold=90
```

### Global Installation

```bash
npm install -g any-hunter
any-hunter ./tsconfig.json
```

---

## 🤫 Inline Rule Disabling

If an explicit `any` or workaround is strictly necessary and intentional, suppress the warning for that single line:

```typescript
// any-hunter-disable-next-line
const payload = JSON.parse(rawResponse) as any;
```

---

## ⚙️ Configuration File (`.anyhunterrc.json`)

Place a `.anyhunterrc.json` (or `.anyhunterrc`, `anyhunter.config.json`) in your project root to standardize quality standards across your team:

```json
{
  "threshold": 85,
  "exclude": [
    "**/*.test.ts",
    "**/*.spec.ts",
    "src/legacy/**",
    "dist/**"
  ],
  "tsconfig": "./tsconfig.json"
}
```

---

## 🛠️ CLI Reference

```text
any-hunter [tsconfigPath] [options]
```

| Option | Description | Default |
| :--- | :--- | :--- |
| `[tsconfigPath]` | Path to target `tsconfig.json` | `./tsconfig.json` |
| `--init` | Generates a starter `.anyhunterrc.json` file | - |
| `--threshold=N` | Minimum required Type-Health Score (0–100) to pass | `80` (or config file) |
| `--exclude="p1,p2"` | Comma-separated glob patterns to exclude files | `[]` |
| `--config=path` | Custom path to configuration file | Auto-detected |
| `--sarif`, `--format=sarif` | Outputs results in standard SARIF format for security dashboards | `false` |
| `--json`, `--format=json` | Outputs raw report in structured JSON format | `false` |

---

## 📋 Audit Rules & Severity Weights

Any-Hunter calculates your score based on the density of issues relative to your Lines of Code (LOC):

$$\text{Penalty Factor} = \left(\frac{\sum \text{Penalties}}{\text{Total LOC}}\right) \times 100$$
$$\text{Type-Health Score} = \max(0, 100 - \text{Penalty Factor})$$

| Rule | Severity | Penalty | Description |
| :--- | :--- | :--- | :--- |
| **Compiler Suppression** | `ERROR` | **-5 pts** | Directives like `// @ts-ignore`, `@ts-expect-error`, or `@ts-nocheck` |
| **Forced Double Casting** | `ERROR` | **-5 pts** | Type bypasses such as `x as any as T` or `x as unknown as T` |
| **Poisoned Parameters** | `ERROR` | **-5 pts** | Function parameters explicitly typed as `any` (`fn(data: any)`) |
| **Leaky Return Types** | `ERROR` | **-5 pts** | Functions declaring `any` as return type (`fn(): any`) |
| **Invisible `any` (Semantic)** | `WARN` | **-2 pts** | Variables implicitly typed as `any` from untyped APIs (`JSON.parse`) |
| **Disguised Generics** | `WARN` | **-2 pts** | Passing `any` into generic references (`Promise<any>`, `Array<any>`) |
| **Explicit `any`** | `WARN` | **-2 pts** | Local variable or property declarations typed as `any` |
| **Direct Cast to `any`** | `WARN` | **-2 pts** | Explicit assertions (`value as any`) |
| **Non-Null Assertion** | `WARN` | **-2 pts** | Use of the non-null assertion operator (`user!.profile`) |

---

## 💻 Programmatic API

You can embed Any-Hunter directly into custom Node.js/TypeScript toolchains:

```typescript
import { analyzeProject, analyzeCode } from 'any-hunter';

// 1. Audit an entire project
const result = analyzeProject('./tsconfig.json', ['**/*.test.ts']);
console.log(`Type-Health Score: ${result.projectScore}/100`);
console.log(`Analyzed LOC: ${result.totalAnalyzedLOC}`);

// 2. Audit a single code snippet in memory
const issues = analyzeCode('virtual.ts', 'let x: any = 42;');
console.log(issues);
```

---

## 🤖 GitHub Actions Integration

Run Any-Hunter natively in your GitHub CI/CD workflows:

### Standard Quality Gate

```yaml
name: Type Health CI

on: [push, pull_request]

jobs:
  audit-types:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Audit TypeScript Health
        uses: JacobPalomo/any-hunter@v1.1.1
        with:
          threshold: 85
          exclude: '**/*.test.ts'
```

### GitHub Code Scanning (SARIF Export)

Export issues directly to your repository's **Security > Code scanning** tab:

```yaml
name: Security & Type Audit

on: [push, pull_request]

jobs:
  sarif-audit:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    steps:
      - uses: actions/checkout@v4

      - name: Run Any-Hunter with SARIF output
        run: npx any-hunter --sarif > results.sarif
        continue-on-error: true

      - name: Upload SARIF to GitHub Security Tab
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: results.sarif
```

---

## 🪝 Local Git Hooks (Husky)

Prevent bad typing practices before code is committed to Git:

**1. Install and initialize Husky:**

```bash
npm install -D husky
npx husky init
```

**2. Add Any-Hunter to `.husky/pre-commit`:**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running Any-Hunter Type Audit..."
npx any-hunter
```

If a commit introduces type violations that lower the project score below the threshold, **the commit will be blocked locally**.

---

## 📄 License

Distributed under the [MIT License](LICENSE). Built by [Jacob Palomo](https://github.com/JacobPalomo/any-hunter).
