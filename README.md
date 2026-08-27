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

## 🚀 Uso Rápido

Ejecuta directamente sin instalar usando `npx`:

```bash
npx any-hunter ./tsconfig.json
```

O instala globalmente:

```bash
npm install -g any-hunter
any-hunter
```

---

## ⚙️ Opciones de CLI

| Opción | Descripción | Valor por defecto |
| :--- | :--- | :--- |
| `[ruta]` | Ruta al archivo `tsconfig.json` del proyecto | `./tsconfig.json` |
| `--threshold=N` | Puntuación mínima requerida (0-100) para aprobar en CI/CD | `80` |
| `--json` | Emite el reporte en formato JSON crudo por `stdout` | `false` |

### Ejemplos:

```bash
# Auditar un proyecto específico con umbral estricto del 95%
any-hunter ./apps/web/tsconfig.json --threshold=95
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

## 📄 Licencia

MIT
