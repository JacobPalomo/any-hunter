# 🎯 any-hunter

[![CI & Type Health Audit](https://github.com/JacobPalomo/any-hunter/actions/workflows/ci.yml/badge.svg)](https://github.com/JacobPalomo/any-hunter/actions/workflows/ci.yml)

> Analizador estático ultraligero con cero dependencias en tiempo de ejecución para auditar la salud de tipos en proyectos de TypeScript.

`any-hunter` recorre el Árbol de Sintaxis Abstracta (AST) de TypeScript para detectar trampas de tipos comunes, calcular una puntuación de salud (**Type-Health Score**) y bloquear pipelines de CI/CD cuando el código no cumple con el estándar de calidad.

---

## ✨ Características

- 🔍 **Detección vía AST:** Cero expresiones regulares sobre código ejecutable; inspección nativa del compilador.
- 💬 **Inspección de Trivia (Comentarios):** Localiza directivas de supresión de compilador (`@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`).
- 🛑 **Detección de Doble Casteo:** Identifica bypass de tipos forzados (`as any as T` o `as unknown as T`).
- 📊 **Type-Health Score:** Métrica ponderada (0 a 100) calculada contra el volumen real de líneas de código (LOC).
- 🚀 **Listo para CI/CD:** Termina con código de salida UNIX (`0` para éxito, `1` para fallo) según el umbral configurado.
- ⚡ **Zero Runtime Dependencies:** Construido únicamente sobre la Compiler API de TypeScript.

---

## 🚀 Instalación y Uso Rápido

Ejecuta directamente sin instalar usando `npx`:

```bash
npx any-hunter ./tsconfig.json
```

Ejecuta el asistente de inicialización para configurar tu proyecto rápidamente:
```bash
npx any-hunter --init
```

Esto creará un archivo .anyhunterrc.json con los valores recomendados.

O instala globalmente:

```bash
npm install -g any-hunter
any-hunter
```

---

## 🤫 Ignorar líneas específicas

Si tienes un caso donde un tipo any está justificado, puedes omitir la revisión en la línea inmediatamente inferior usando este comentario:

```typescript
// any-hunter-disable-next-line
const data = JSON.parse(response) as any;
```

---

## ⚙️ Archivo de Configuración (`.anyhunterrc.json`)

Puedes crear un archivo `.anyhunterrc.json` en la raíz de tu proyecto para evitar pasar flags en cada ejecución:

```json
{
  "threshold": 85,
  "exclude": [
    "**/*.test.ts",
    "src/legacy/**"
  ],
  "tsconfig": "./tsconfig.json"
}
```

---

## ⚙️ Opciones de CLI

| Opción | Descripción | Valor por defecto |
| :--- | :--- | :--- |
| `[ruta]` | Ruta al archivo `tsconfig.json` del proyecto | `./tsconfig.json` |
| `--init` | Genera un archivo `.anyhunterrc.json` base. | - |
| `--sarif` | Exporta los resultados en formato SARIF (Ideal para la pestaña Security de GitHub). | - |
| `--config=ruta` | Ruta personalizada a un archivo de configuración | `.anyhunterrc.json`
| `--threshold=N` | Puntuación mínima requerida (0-100) para aprobar en CI/CD | `80` |
| `--exclude="patrón"` | Patrones glob separados por coma para ignorar archivos | - |
| `--json` | Emite el reporte en formato JSON crudo por `stdout` | `false` |

### Ejemplos:

```bash
# Auditar un proyecto específico con umbral estricto del 95%
any-hunter ./apps/web/tsconfig.json --threshold=95
```

---

## 💻 Uso Programático (API)

Puedes importar y usar el motor de `any-hunter` directamente en tus scripts de TypeScript o JavaScript:

```typescript
import { analyzeProject, analyzeCode } from 'any-hunter';

// Analizar un proyecto completo
const { projectScore, projectIssues } = analyzeProject('./tsconfig.json');
console.log(`Puntaje de salud: ${projectScore}/100`);

// Analizar código en memoria
const snippetIssues = analyzeCode('snippet.ts', 'let x: any = 10;');
console.log(snippetIssues);
```

---

## 📋 Reglas Auditadas

| Regla | Severidad | Penalización |
| :--- | :--- | :--- |
| **Directivas de supresión** (`@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`) | `ERROR` | -5 pts |
| **Doble casteo forzado** (`as any as T`, `as unknown as T`) | `ERROR` | -5 pts |
| **Uso explícito de `any`** (`let x: any`) | `WARN` | -2 pts |
| **Casteo directo a `any`** (`expr as any`) | `WARN` | -2 pts |
| **Operador non-null assertion** (`user!.profile`) | `WARN` | -2 pts |

---

## 🧠 Auditoría Semántica y Cacería Profunda

A diferencia de linters basados únicamente en texto, Any-Hunter analiza el **Árbol de Sintaxis Abstracta (AST)** y usa el **TypeChecker de TypeScript** para detectar fugas de tipos complejas:

*   🪝 **Parámetros envenenados:** Penaliza funciones que reciben `any` y contaminan su *scope* interno.
*   🚰 **Fugas de retorno:** Detecta funciones que exponen `any` hacia el exterior.
*   📦 **Genéricos camuflados:** Atrapa `Promise<any>`, `Array<any>`, o `Record<string, any>`.
*   👻 **Any Invisible (Semántico):** Detecta variables que no tienen `any` escrito literalmente, pero que lo infirieron de APIs sin tipar (ej. `const data = JSON.parse(res)`).

---

## 🤖 Integración con GitHub Actions

Puedes integrar Any-Hunter directamente en tus pipelines sin necesidad de instalarlo usando mi Action oficial:

```yaml
jobs:
  audit-types:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout del código
        uses: actions/checkout@v4
      
      - name: Validar tipos con Any-Hunter
        uses: JacobPalomo/any-hunter@v0.9.0
        with:
          threshold: 90
          exclude: '**/*.test.ts'

---

## 📄 Licencia

MIT
