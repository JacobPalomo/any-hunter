import ts from 'typescript';
import path from 'node:path';
import { analyzeCode } from './analyzer.js';
import type { Issue } from './types.js';

export interface ProjectAnalysisResult {
  projectIssues: Issue[];
  projectScore: number;
  totalAnalyzedLOC: number;
  excludedFilesCount: number;
}

/**
 * Valida si una ruta coincide con algún patrón glob (ej: ** / *.test.ts, src/legacy/**)
 */
export function isExcluded(filePath: string, excludePatterns: string[]): boolean {
  if (excludePatterns.length === 0) return false;
  const normalizedPath = filePath.replace(/\\/g, '/');

  return excludePatterns.some((pattern) => {
    const cleanPattern = pattern.trim().replace(/\\/g, '/');
    if (!cleanPattern) return false;

    // Convertir glob a RegExp nativa
    const regexStr = cleanPattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '___GLOBSTAR___')
      .replace(/\*/g, '[^/]*')
      .replace(/___GLOBSTAR___/g, '.*')
      .replace(/\?/g, '.');

    const regex = new RegExp(`(^|/)${regexStr}$|^${regexStr}$`);
    return regex.test(normalizedPath);
  });
}

export function analyzeProject(
  configPath: string,
  excludePatterns: string[] = []
): ProjectAnalysisResult {
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);

  if (configFile.error) {
    const message = ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n');
    throw new Error(`Error al leer ${configPath}: ${message}`);
  }

  const basePath = path.dirname(path.resolve(configPath));
  const parsedCommandLine = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    basePath
  );

  if (parsedCommandLine.errors.length > 0) {
    const firstError = parsedCommandLine.errors[0];
    const message = firstError
      ? ts.flattenDiagnosticMessageText(firstError.messageText, '\n')
      : 'Error desconocido en tsconfig';
    throw new Error(`Error en la configuración de TypeScript: ${message}`);
  }

  // 1. Crear el Programa de TypeScript para habilitar análisis semántico
  const program = ts.createProgram(parsedCommandLine.fileNames, parsedCommandLine.options);
  const checker = program.getTypeChecker();

  const allFiles = parsedCommandLine.fileNames;
  const targetFiles = allFiles.filter((file) => !isExcluded(file, excludePatterns));
  const excludedFilesCount = allFiles.length - targetFiles.length;

  let totalAnalyzedLOC = 0;
  const projectIssues: Issue[] = [];

  for (const fileName of targetFiles) {
    const sourceFile = program.getSourceFile(fileName);
    if (sourceFile && !sourceFile.isDeclarationFile) {
      const lines = sourceFile.getFullText().split(/\r\n|\r|\n/).length;
      totalAnalyzedLOC += lines;

      // Pasa el sourceFile del program y el checker
      const fileIssues = analyzeCode(fileName, sourceFile, checker);
      projectIssues.push(...fileIssues);
    }
  }

  // Cálculo de penalizaciones
  let totalPenalty = 0;
  for (const issue of projectIssues) {
    if (issue.severity === 'error') {
      totalPenalty += 5;
    } else if (issue.severity === 'warning') {
      totalPenalty += 2;
    }
  }

  const penaltyFactor = totalAnalyzedLOC > 0 ? (totalPenalty / totalAnalyzedLOC) * 100 : 0;
  const projectScore = Math.max(0, Math.round(100 - penaltyFactor));

  return {
    projectIssues,
    projectScore,
    totalAnalyzedLOC,
    excludedFilesCount,
  };
}
