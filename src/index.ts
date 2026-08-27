#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { analyzeProject } from './project.js';
import { c } from './colors.js';

// 1. Separar argumentos y banderas
const args = process.argv.slice(2);
const isJson = args.includes('--json');

const configArg = args.find((arg) => !arg.startsWith('--'));
const configPath = configArg ?? './tsconfig.json';

const thresholdArg = args.find((arg) => arg.startsWith('--threshold='));
const THRESHOLD = thresholdArg ? Number(thresholdArg.split('=')[1]) : 80;

// Extraer patrones de exclusión (soporta --exclude="*.test.ts,src/legacy/**")
const excludeArgs = args.filter((arg) => arg.startsWith('--exclude='));
const excludePatterns = excludeArgs.flatMap((arg) =>
  arg
    .slice('--exclude='.length)
    .replace(/^["']|["']$/g, '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
);

const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

if (!fs.existsSync(configPath)) {
  if (isJson) {
    console.error(JSON.stringify({ error: `No se encontró la configuración en: ${configPath}` }));
  } else {
    console.error(`${c.red}[Error] No se encontró la configuración en: ${configPath}${c.reset}`);
  }
  process.exit(1);
}

// 2. Ejecutar análisis con exclusiones
const { projectIssues, projectScore, totalAnalyzedLOC, excludedFilesCount } = analyzeProject(
  configPath,
  excludePatterns
);

const warningsCount = projectIssues.filter((i) => i.severity === 'warning').length;
const errorsCount = projectIssues.filter((i) => i.severity === 'error').length;
const passed = projectScore >= THRESHOLD;

// 3. Salida en formato JSON
if (isJson) {
  const jsonReport = {
    score: projectScore,
    threshold: THRESHOLD,
    passed,
    totalAnalyzedLOC,
    excludedFilesCount,
    excludedPatterns: excludePatterns,
    summary: {
      errors: errorsCount,
      warnings: warningsCount,
      total: projectIssues.length,
    },
    issues: projectIssues,
  };

  console.log(JSON.stringify(jsonReport, null, 2));
  process.exit(passed ? 0 : 1);
}

// 4. Salida CLI visual
console.log(`\n${c.bold}${c.cyan}🔍 Any-Hunter — Auditoría de Tipos${c.reset}\n`);

if (projectIssues.length === 0) {
  console.log(`${c.green}✨ ¡Código impecable! No se encontraron trampas de tipos.${c.reset}\n`);
} else {
  for (const issue of projectIssues) {
    const isError = issue.severity === 'error';
    const tag = isError
      ? `${c.red}${c.bold}❌ ERROR${c.reset}`
      : `${c.yellow}${c.bold}🟡 WARN ${c.reset}`;

    const location = `${c.gray}${issue.file}:${issue.line}:${issue.character}${c.reset}`;
    console.log(`${tag} ${location} -> ${issue.message}`);

    if (isGitHubActions) {
      const relativePath = path.relative(process.cwd(), issue.file);
      console.log(
        `::${issue.severity} file=${relativePath},line=${issue.line},col=${issue.character}::${issue.message}`
      );
    }
  }
  console.log();
}

// 5. Imprimir métricas finales
const printRow = (icon: string, label: string, value: string) => {
  console.log(`${icon}  ${label.padEnd(24)} ${value}`);
};

console.log(`${c.dim}──────────────────────────────────────────────────${c.reset}`);
printRow('📁', 'Archivo de config:', `${c.bold}${configPath}${c.reset}`);
printRow('📊', 'Líneas de código (LOC):', `${c.bold}${totalAnalyzedLOC}${c.reset}`);
if (excludedFilesCount > 0) {
  printRow('🚫', 'Archivos excluidos:', `${c.dim}${excludedFilesCount}${c.reset}`);
}
printRow('🟡', 'Advertencias:', `${c.yellow}${warningsCount}${c.reset}`);
printRow('❌', 'Errores críticos:', `${c.red}${errorsCount}${c.reset}`);

const scoreColor = passed ? c.green : c.red;
printRow(
  '🎯',
  'Type-Health Score:',
  `${scoreColor}${c.bold}${projectScore}/100${c.reset} ${c.dim}(Mínimo: ${THRESHOLD})${c.reset}`
);
console.log(`${c.dim}──────────────────────────────────────────────────${c.reset}\n`);

// 6. Decisión de salida
if (!passed) {
  console.log(`${c.red}${c.bold}❌ FALLO:${c.reset} La calidad de tipos está por debajo del umbral.\n`);
  process.exit(1);
} else {
  console.log(`${c.green}${c.bold}✅ ÉXITO:${c.reset} El proyecto supera el estándar de calidad.\n`);
  process.exit(0);
}
