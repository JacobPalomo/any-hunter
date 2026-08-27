# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [0.4.0] - 2026-08-27

### Added
- Bandera `--json` para exportar el resultado del análisis y métricas en formato JSON estructurado.
- Supresión de colores ANSI y decoraciones cuando se activa el modo JSON.

## [0.3.0] - 2026-08-27

### Added
- Detección del operador non-null assertion (`!`) para prevenir fallos en runtime por valores `null` o `undefined`.
- Detección de casteo forzado directo (`expr as any`).
- Nuevas pruebas unitarias para validar las reglas añadidas.

## [0.2.0] - 2026-08-27

### Added
- Integración nativa con GitHub Actions Annotations (`::error::` y `::warning::`) para resaltar incidencias directamente en Pull Requests.
- Soporte para detección de variables de entorno CI.

---

## [0.1.0] - 2026-08-27

### Added
- Motor de análisis estático basado en la AST Compiler API de TypeScript.
- Detección de uso explícito de `any`.
- Detección de doble casteo (`as any as T` y `as unknown as T`).
- Detección de directivas de supresión en comentarios trivia (`@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`).
- Cálculo de métrica ponderada **Type-Health Score** basada en líneas de código (LOC).
- Interfaz de línea de comandos (CLI) con formateo de colores ANSI y alineación dinámica.
- Soporte para banderas de terminal como `--threshold=N`.
- Suite de pruebas unitarias nativas con `node:test`.
- Pipeline de integración continua automatizado con GitHub Actions.
