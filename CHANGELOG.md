# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.1.0] - 2026-08-27

### Added
- **Auditoría Semántica (TypeChecker):** Detección de "Any Invisible" implícito en variables provenientes de funciones que retornan `any` (ej: `JSON.parse`).
- **Cacería Profunda de AST:** 
  - Detección de parámetros envenenados (`function(data: any)`).
  - Detección de fugas de retorno (`(): any => {}`).
  - Detección de genéricos camuflados (`Promise<any>`).
- Clasificación de severidad estricta (`error` para retornos y parámetros, `warning` para variables locales).

## [1.0.0] - 2026-08-27

¡Lanzamiento de la versión estable 1.0.0! Any-Hunter ahora es una herramienta completa para auditoría a nivel empresarial.

### Added
- **Asistente de Inicialización (`--init`):** Genera automáticamente un archivo base `.anyhunterrc.json`.
- **Formato SARIF (`--sarif`):** Soporte de exportación de reportes al estándar SARIF, permitiendo su integración con la pestaña *Security / Code Scanning* de GitHub.
- **Exclusiones por línea (`// any-hunter-disable-next-line`):** Capacidad de saltarse el linter en líneas específicas de código justificado.

## [0.9.0] - 2026-08-27

### Added
- Integración oficial para GitHub Actions (`action.yml`). Permite usar `uses: JacobPalomo/any-hunter@v0.9.0` en workflows.

## [0.8.0] - 2026-08-27

### Added
- Entrada programática (`src/api.ts` -> `dist/api.js`) para consumir `any-hunter` como librería de Node.js.
- Exportación de tipos TypeScript (`dist/api.d.ts`) y configuración de `exports` en `package.json`.
- Pruebas unitarias para validar las exportaciones del punto de entrada programático.

## [0.7.0] - 2026-08-27

### Added
- Soporte para archivo de configuración `.anyhunterrc.json` (o `.anyhunterrc` / `anyhunter.config.json`).
- Bandera `--config=ruta` para especificar rutas arbitrarias a archivos de configuración.
- Fusión automática de exclusiones y umbrales entre archivo de configuración y flags de terminal.

## [0.6.0] - 2026-08-27

### Added
- Soporte para GitHub Actions Step Summary (`$GITHUB_STEP_SUMMARY`), renderizando un reporte visual en Markdown con tablas de métricas y desglose de incidencias en el resumen del workflow.

## [0.5.0] - 2026-08-27

### Added
- Bandera `--exclude` para ignorar archivos y carpetas mediante patrones glob (ej: `--exclude="*.test.ts,src/legacy/**"`).
- Nueva función auxiliar `isExcluded` con soporte para comodines (`*`, `**`, `?`) sin dependencias externas.
- Métrica de conteo de archivos excluidos en reportes de terminal y JSON.

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
