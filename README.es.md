<div align="center">

# 🎯 any-hunter

**Auditor semántico y de AST para la salud de tipos en TypeScript (Cero dependencias)**

[![CI & Type Health Audit](https://github.com/JacobPalomo/any-hunter/actions/workflows/ci.yml/badge.svg)](https://github.com/JacobPalomo/any-hunter/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Licencia: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://github.com/JacobPalomo/any-hunter)

[English](README.md) | [Español](README.es.md)

<p align="center">
  Detén la erosión de tipos antes de que llegue a producción. Any-Hunter analiza el AST y utiliza el TypeChecker del compilador de TypeScript para calcular un <b>Type-Health Score (0–100)</b> en tiempo real, cazar <code>any</code>s invisibles y aplicar controles de calidad en tus pipelines de CI/CD.
</p>

</div>

---

## ✨ Características

- 🔍 **Inspección Profunda de AST:** Cero expresiones regulares sobre código fuente; analiza árboles sintácticos reales mediante la Compiler API de TypeScript.
- 🧠 **Análisis Semántico (TypeChecker):** Detecta "Any Invisibles" inferidos a partir de llamadas sin validar como `JSON.parse()` o librerías de terceros sin tipos.
- 🪝 **Penalizaciones Contextuales:** Trata los parámetros envenenados y las fugas de retorno con mayor severidad que las variables locales.
- 💬 **Auditoría de Directivas Trivia:** Identifica comentarios de supresión del compilador (`@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`).
- 🛑 **Detección de Doble Casteo Forzado:** Bloquea bypasses inseguros del sistema de tipos (`as any as T`, `as unknown as T`).
- 📊 **Type-Health Score Cuantificado:** Puntuación ponderada (0 a 100) normalizada contra el total de Líneas de Código (LOC) de tu proyecto.
- 🛡️ **SARIF y GitHub Step Summaries:** Integración nativa con GitHub Code Scanning (pestaña Security) y resúmenes de CI sin necesidad de plugins externos.
- ⚡ **Zero Runtime Dependencies:** Ultrarrápido, ligero y completamente autocontenido.

---

## 🚀 Inicio Rápido

### 1. Inicializar Configuración (Recomendado)

Genera un archivo `.anyhunterrc.json` preconfigurado en la raíz de tu proyecto:

```bash
npx any-hunter --init
```

### 2. Ejecutar Auditoría

Audita tu `./tsconfig.json` predeterminado:

```bash
npx any-hunter
```

O apunta a un proyecto específico con un umbral de aprobación mínimo:

```bash
npx any-hunter ./apps/api/tsconfig.json --threshold=90
```

### Instalación Global

```bash
npm install -g any-hunter
any-hunter ./tsconfig.json
```

---

## 🤫 Ignorar Reglas por Línea

Si un `any` explícito o una excepción están justificados y son intencionales, puedes omitir la advertencia en la línea inmediatamente inferior:

```typescript
// any-hunter-disable-next-line
const payload = JSON.parse(rawResponse) as any;
```

---

## ⚙️ Archivo de Configuración (`.anyhunterrc.json`)

Coloca un archivo `.anyhunterrc.json` (o `.anyhunterrc`, `anyhunter.config.json`) en la raíz de tu repositorio para estandarizar las reglas de calidad en todo tu equipo:

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

## 🛠️ Referencia de CLI

```text
any-hunter [tsconfigPath] [opciones]
```

| Opción | Descripción | Valor por defecto |
| :--- | :--- | :--- |
| `[tsconfigPath]` | Ruta al archivo `tsconfig.json` objetivo | `./tsconfig.json` |
| `--init` | Genera un archivo `.anyhunterrc.json` inicial | - |
| `--threshold=N` | Puntuación mínima de Type-Health (0–100) para aprobar | `80` (o el del archivo de config) |
| `--exclude="p1,p2"` | Patrones glob separados por coma para excluir archivos | `[]` |
| `--config=ruta` | Ruta personalizada a un archivo de configuración | Detección automática |
| `--sarif`, `--format=sarif` | Emite los resultados en formato estándar SARIF para paneles de seguridad | `false` |
| `--json`, `--format=json` | Emite el reporte en formato JSON estructurado por `stdout` | `false` |

---

## 📋 Reglas Auditadas y Ponderación de Severidad

Any-Hunter calcula la puntuación según la densidad de incidencias en relación con el total de Líneas de Código (LOC):

$$\text{Factor de Penalización} = \left(\frac{\sum \text{Penalizaciones}}{\text{Total LOC}}\right) \times 100$$
$$\text{Type-Health Score} = \max(0, 100 - \text{Factor de Penalización})$$

| Regla | Severidad | Penalización | Descripción |
| :--- | :--- | :--- | :--- |
| **Supresión de Compilador** | `ERROR` | **-5 pts** | Directivas como `// @ts-ignore`, `@ts-expect-error` o `@ts-nocheck` |
| **Doble Casteo Forzado** | `ERROR` | **-5 pts** | Bypasses de tipos como `x as any as T` o `x as unknown as T` |
| **Parámetros Envenenados** | `ERROR` | **-5 pts** | Argumentos de funciones tipados explícitamente como `any` (`fn(data: any)`) |
| **Fugas de Retorno** | `ERROR` | **-5 pts** | Funciones que declaran `any` como tipo de retorno (`fn(): any`) |
| **Any Invisible (Semántico)** | `WARN` | **-2 pts** | Variables que infieren `any` implícitamente de APIs sin tipos (`JSON.parse`) |
| **Genéricos Camuflados** | `WARN` | **-2 pts** | Pasar `any` a referencias genéricas (`Promise<any>`, `Array<any>`) |
| **Uso Explícito de `any`** | `WARN` | **-2 pts** | Declaración de variables locales o propiedades tipadas como `any` |
| **Casteo Directo a `any`** | `WARN` | **-2 pts** | Aserciones explícitas (`value as any`) |
| **Non-Null Assertion** | `WARN` | **-2 pts** | Uso del operador non-null assertion (`user!.profile`) |

---

## 💻 Uso Programático (API)

Puedes importar y usar Any-Hunter directamente en tus scripts de Node.js o TypeScript:

```typescript
import { analyzeProject, analyzeCode } from 'any-hunter';

// 1. Auditar un proyecto completo
const result = analyzeProject('./tsconfig.json', ['**/*.test.ts']);
console.log(`Type-Health Score: ${result.projectScore}/100`);
console.log(`Líneas analizadas (LOC): ${result.totalAnalyzedLOC}`);

// 2. Auditar un fragmento de código en memoria
const issues = analyzeCode('virtual.ts', 'let x: any = 42;');
console.log(issues);
```

---

## 🤖 Integración con GitHub Actions

Ejecuta Any-Hunter nativamente en tus flujos de CI/CD de GitHub:

### Control de Calidad Estándar

```yaml
name: Type Health CI

on: [push, pull_request]

jobs:
  audit-types:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout del repositorio
        uses: actions/checkout@v4

      - name: Auditar Salud de Tipos con Any-Hunter
        uses: JacobPalomo/any-hunter@v1.1.1
        with:
          threshold: 85
          exclude: '**/*.test.ts'
```

### GitHub Code Scanning (Exportación SARIF)

Exporta incidencias directamente a la pestaña **Security > Code scanning** de tu repositorio:

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

      - name: Ejecutar Any-Hunter con salida SARIF
        run: npx any-hunter --sarif > results.sarif
        continue-on-error: true

      - name: Subir reporte SARIF a GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: results.sarif
```

---

## 🪝 Integración Local (Git Hooks con Husky)

Evita que código con baja calidad de tipos llegue al repositorio:

**1. Instalar e inicializar Husky:**

```bash
npm install -D husky
npx husky init
```

**2. Añadir Any-Hunter a `.husky/pre-commit`:**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Ejecutando auditoría de tipos con Any-Hunter..."
npx any-hunter
```

Si un commit introduce malas prácticas que reduzcan la salud del proyecto por debajo del umbral, **el commit será bloqueado automáticamente en tu máquina local**.

---

## 📄 Licencia

Distribuido bajo la [Licencia MIT](LICENSE). Creado por [Jacob Palomo](https://github.com/JacobPalomo/any-hunter).
