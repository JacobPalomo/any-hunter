#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { analyzeProject } from './project.js';
import { loadConfigFile, type LoadedConfig } from './config.js';
import { c } from './colors.js';

// 1. Separar argumentos y banderas
const args = process.argv.slice(2);
const isJson = args.includes('--json');

const configFlag = args.find((arg) => arg.startsWith('--config='));
const customConfigPath = configFlag ? configFlag.split('=')[1]?.replace(/^["']|["']$/g, '') : undefined;

let fileConfig: LoadedConfig = { config: {}, configFilePath: null };
try {
  fileConfig = loadConfigFile(customConfigPath);
} catch (err) {
  if (err instanceof Error) {
    if (isJson) {
      console.error(JSON.stringify({ error: err.message }));
    } else {
      console.error(`${c.red}[Error] ${err.message}${c.reset}`);
    }
  }

  console.error(`${c.red}[Error] Error desconocido${c.reset}`)
  process.exit(1);
}

const configArg = args.find((arg) => !arg.startsWith('--'));
const configPath = configArg ?? fileConfig.config.tsconfig ?? './tsconfig.json';

const thresholdArg = args.find((arg) => arg.startsWith('--threshold='));
const THRESHOLD = thresholdArg
  ? Number(thresholdArg.split('=')[1])
  : (fileConfig.config.threshold ?? 80);

// Extraer patrones de exclusión de CLI y combinarlos con los del archivo
const excludeArgs = args.filter((arg) => arg.startsWith('--exclude='));
const cliExcludePatterns = excludeArgs.flatMap((arg) =>
  arg
    .slice('--exclude='.length)
    .replace(/^["']|["']$/g, '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
);
const excludePatterns = Array.from(
  new Set([...(fileConfig.config.exclude ?? []), ...cliExcludePatterns])
);

const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
const summaryFile = process.env.GITHUB_STEP_SUMMARY;

if (!fs.existsSync(configPath)) {
  if (isJson) {
    console.error(JSON.stringify({ error: `No se encontró la configuración en: ${configPath}` }));
  } else {
    console.error(`${c.red}[Error] No se encontró la configuración en: ${configPath}${c.reset}`);
  }
  process.exit(1);
}

// 2. Ejecutar análisis
const { projectIssues, projectScore, totalAnalyzedLOC, excludedFilesCount } = analyzeProject(
  configPath,
  excludePatterns
);

const warningsCount = projectIssues.filter((i) => i.severity === 'warning').length;
const errorsCount = projectIssues.filter((i) => i.severity === 'error').length;
const passed = projectScore >= THRESHOLD;

// 3. Escribir GitHub Step Summary
if (summaryFile) {
  const issuesTable =
    projectIssues.length > 0
      ? `### 📋 Incidencias Detectadas

| Severidad | Ubicación | Mensaje |
| :--- | :--- | :--- |
${projectIssues
  .map((i) => {
    const icon = i.severity === 'error' ? '❌ Error' : '🟡 Warn';
    const loc = `\`${path.relative(process.cwd(), i.file)}:${i.line}:${i.character}\``;
    return `| ${icon} | ${loc} | ${i.message} |`;
  })
  .join('\n')}`
      : '✨ **¡Código impecable! No se encontraron trampas de tipos.**';

  const summaryMarkdown = `## 🎯 Any-Hunter — Auditoría de Salud de Tipos

| Métrica | Valor |
| :--- | :--- |
| **Resultado** | ${passed ? '✅ **Aprobado**' : '❌ **Reprobado**'} |
| **Type-Health Score** | **${projectScore}/100** (Mínimo: ${THRESHOLD}) |
| **Líneas analizadas (LOC)** | ${totalAnalyzedLOC} |
| **Advertencias** | ${warningsCount} |
| **Errores críticos** | ${errorsCount} |
${excludedFilesCount > 0 ? `| **Archivos excluidos** | ${excludedFilesCount} |\n` : ''}

${issuesTable}
`;

  try {
    fs.appendFileSync(summaryFile, summaryMarkdown, 'utf-8');
  } catch (err) {
    console.error('Error al escribir en GITHUB_STEP_SUMMARY:', err);
  }
}

// 4. Salida en formato JSON
if (isJson) {
  const jsonReport = {
    score: projectScore,
    threshold: THRESHOLD,
    passed,
    totalAnalyzedLOC,
    excludedFilesCount,
    excludedPatterns: excludePatterns,
    configFile: fileConfig.configFilePath,
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

// 5. Salida CLI visual
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

// 6. Imprimir métricas finales
const printRow = (icon: string, label: string, value: string) => {
  console.log(`${icon}  ${label.padEnd(24)} ${value}`);
};

console.log(`${c.dim}──────────────────────────────────────────────────${c.reset}`);
printRow('📁', 'Archivo de config:', `${c.bold}${configPath}${c.reset}`);
if (fileConfig.configFilePath) {
  printRow('⚙️',  'Ajustes Any-Hunter:', `${c.dim}${fileConfig.configFilePath}${c.reset}`);
}
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

// 7. Decisión de salida
if (!passed) {
  console.log(`${c.red}${c.bold}❌ FALLO:${c.reset} La calidad de tipos está por debajo del umbral.\n`);
  process.exit(1);
} else {
  console.log(`${c.green}${c.bold}✅ ÉXITO:${c.reset} El proyecto supera el estándar de calidad.\n`);
  process.exit(0);
}
