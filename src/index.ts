#!/usr/bin/env node

import fs from 'node:fs';
import { analyzeProject } from './project.js';
import { c } from './colors.js'

const args = process.argv.slice(2);

const configArg = args.find((arg) => !arg.startsWith('--'));
const configPath = configArg ?? './tsconfig.json';

const thresholdArg = args.find((arg) => arg.startsWith('--threshold='));
const THRESHOLD = thresholdArg ? Number(thresholdArg.split('=')[1]) : 80;

if (!fs.existsSync(configPath)) {
  console.error(`${c.red}[Error] No se encontró la configuración en: ${configPath}${c.reset}`);
  process.exit(1);
}

const { projectIssues, projectScore, totalAnalyzedLOC } = analyzeProject(configPath);

const warningsCount = projectIssues.filter((i) => i.severity === 'warning').length;
const errorsCount = projectIssues.filter((i) => i.severity === 'error').length;

console.log(`\n${c.bold}${c.cyan}🔍 Any-Hunter — Auditoría de Tipos${c.reset}\n`);

if (projectIssues.length === 0) {
  console.log(`${c.green}✨ ¡Código impecable! No se encontraron trampas de tipos.${c.reset}\n`);
} else {
  for (const issue of projectIssues) {
    const isError = issue.severity === 'error';
    const tag = isError
      ? `${c.red}${c.bold}❌ ERROR${c.reset}`
      : `${c.yellow}${c.bold}⚠️  WARN ${c.reset}`;

    const location = `${c.gray}${issue.file}:${issue.line}:${issue.character}${c.reset}`;
    console.log(`${tag} ${location} -> ${issue.message}`);
  }
  console.log();
}

const printRow = (icon: string, label: string, value: string) => {
  console.log(`${icon}  ${label.padEnd(24)} ${value}`);
};

console.log(`${c.dim}──────────────────────────────────────────────────${c.reset}`);
printRow('📁', 'Archivo de config:', `${c.bold}${configPath}${c.reset}`);
printRow('📊', 'Líneas de código (LOC):', `${c.bold}${totalAnalyzedLOC}${c.reset}`);
printRow('🟡', 'Advertencias:', `${c.yellow}${warningsCount}${c.reset}`);
printRow('❌', 'Errores críticos:', `${c.red}${errorsCount}${c.reset}`);

const scoreColor = projectScore >= THRESHOLD ? c.green : c.red;
printRow(
  '🎯',
  'Type-Health Score:',
  `${scoreColor}${c.bold}${projectScore}/100${c.reset} ${c.dim}(Mínimo: ${THRESHOLD})${c.reset}`
);
console.log(`${c.dim}──────────────────────────────────────────────────${c.reset}\n`);

if (projectScore < THRESHOLD) {
  console.log(`${c.red}${c.bold}❌ FALLO:${c.reset} La calidad de tipos está por debajo del umbral.\n`);
  process.exit(1);
} else {
  console.log(`${c.green}${c.bold}✅ ÉXITO:${c.reset} El proyecto supera el estándar de calidad.\n`);
  process.exit(0);
}
