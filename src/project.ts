import ts from 'typescript';
import fs from 'node:fs';
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
    throw new Error(
      `Error al leer ${configPath}: ${ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n')}`
    );
  }

  const basePath = path.dirname(path.resolve(configPath));
  const parsedCommandLine = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    basePath
  );

  if (parsedCommandLine.errors.length > 0) {
    const firstError = parsedCommandLine.errors[0];
    if (firstError) {
      throw new Error(
        `Error en la configuración de TypeScript: ${ts.flattenDiagnosticMessageText(firstError.messageText, '\n')}`
      );
    }
  }

  const allFiles = parsedCommandLine.fileNames;
  const targetFiles = allFiles.filter((file) => !isExcluded(file, excludePatterns));
  const excludedFilesCount = allFiles.length - targetFiles.length;

  let totalAnalyzedLOC = 0;
  const projectIssues: Issue[] = [];

  for (const fileName of targetFiles) {
    if (fs.existsSync(fileName)) {
      const content = fs.readFileSync(fileName, 'utf-8');
      const lines = content.split(/\r\n|\r|\n/).length;
      totalAnalyzedLOC += lines;

      const fileIssues = analyzeCode(fileName, content);
      projectIssues.push(...fileIssues);
    }
  }

  // Cálculo de penalizaciones
  let totalPenalty = 0;
  for (const issue of projectIssues) {
    switch (issue.severity) {
      case 'error':
        totalPenalty += 5;
        break

      case 'warning':
        totalPenalty += 2;
        break

      default:
        const exhaustiveCheck: never = issue.severity
        throw new Error(`Severidad no reconocida: ${exhaustiveCheck}`);
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
