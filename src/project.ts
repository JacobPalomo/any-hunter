import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
import type { Issue, ProjectAnalysis } from './types.js';
import { analyzeCode } from './analyzer.js';

export function getProjectFiles(configPath: string): string[] {
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);

  if (configFile.error) {
    console.error(`[Error] No se pudo leer ${configPath}`);
    process.exit(1);
  }

  const basePath = path.dirname(path.resolve(configPath));

  const parsedCommandLine = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    basePath
  );

  return parsedCommandLine.fileNames;
}

export function analyzeProject(configPath: string): ProjectAnalysis {
  const files = getProjectFiles(configPath);
  const allIssues: Issue[] = [];
  let totalAnalyzedLOC = 0;
  let totalLostScore = 0;

  for (const filePath of files) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    totalAnalyzedLOC += fileContent.split('\n').length;
    const issues = analyzeCode(filePath, fileContent);

    issues.forEach((issue) => {
      switch (issue.severity) {
        case 'warning':
          totalLostScore += 2;
          break;
        case 'error':
          totalLostScore += 5;
          break;
        default: {
          const exhaustiveCheck: never = issue.severity;
          throw new Error(`Severidad no reconocida: ${exhaustiveCheck}`);
        }
      }
    });

    allIssues.push(...issues);
  }

  const calculatedScore =
    totalAnalyzedLOC === 0
      ? 100
      : Math.max(0, 100 - (totalLostScore / totalAnalyzedLOC) * 100);

  return {
    projectIssues: allIssues,
    projectScore: Math.round(calculatedScore),
    totalAnalyzedLOC,
  };
}
