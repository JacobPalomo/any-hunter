import ts from 'typescript';
import type { Issue } from './types.js';

export function analyzeCode(
  fileName: string,
  sourceTextOrFile: string | ts.SourceFile,
  checker?: ts.TypeChecker
): Issue[] {
  const issues: Issue[] = [];
  const sourceFile =
    typeof sourceTextOrFile === 'string'
      ? ts.createSourceFile(fileName, sourceTextOrFile, ts.ScriptTarget.Latest, true)
      : sourceTextOrFile;

  const sourceText = sourceFile.getFullText();

  // 1. Escanear comentarios de exclusión local
  const disabledLines = new Set<number>();
  const lines = sourceText.split(/\r\n|\r|\n/);
  lines.forEach((lineText, index) => {
    if (lineText.includes('// any-hunter-disable-next-line')) {
      disabledLines.add(index + 2);
    }
  });

  // 2. Escanear directivas @ts-ignore, @ts-expect-error, etc.
  const triviaRegex = /\/\/\s*(@ts-(?:ignore|expect-error|nocheck))/g;
  let match: RegExpExecArray | null;

  while ((match = triviaRegex.exec(sourceText)) !== null) {
    const directive = match[1];
    const pos = match.index;
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(pos);

    issues.push({
      file: fileName,
      line: line + 1,
      character: character + 1,
      message: `Directiva de supresión detectada: ${directive}`,
      severity: 'error',
    });
  }

  // 3. Recorrer el AST (Sintáctico + Semántico)
  function visit(node: ts.Node) {
    // Regla: Non-null assertion operator (!)
    if (ts.isNonNullExpression(node)) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      issues.push({
        file: fileName,
        line: line + 1,
        character: character + 1,
        message: 'Uso del operador non-null assertion (!). Puede causar errores en runtime si el valor es null o undefined.',
        severity: 'warning',
      });
    }

    // Regla: Doble casteo forzado y casteo directo
    if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) {
      const inner = node.expression;
      if (ts.isAsExpression(inner) || ts.isTypeAssertionExpression(inner)) {
        const innerType = inner.type;
        if (
          innerType.kind === ts.SyntaxKind.AnyKeyword ||
          innerType.kind === ts.SyntaxKind.UnknownKeyword
        ) {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          issues.push({
            file: fileName,
            line: line + 1,
            character: character + 1,
            message: 'Doble casteo forzado detectado (ej: as any as T). Rompe por completo la seguridad de tipos.',
            severity: 'error',
          });
        }
      }

      // Regla: Casteo directo a any (ej: x as any)
      if (node.type.kind === ts.SyntaxKind.AnyKeyword) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        issues.push({
          file: fileName,
          line: line + 1,
          character: character + 1,
          message: 'Casteo forzado a any (as any). Prefiere unknown o tipar correctamente la estructura.',
          severity: 'warning',
        });
      }
    }

    // Regla: Sintaxis explícita de 'any'
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      const parent = node.parent;
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      const baseIssue = { file: fileName, line: line + 1, character: character + 1, severity: 'warning' as const };

      if (parent && parent.kind !== ts.SyntaxKind.AsExpression && parent.kind !== ts.SyntaxKind.TypeAssertionExpression) {
        if (parent.kind === ts.SyntaxKind.Parameter) {
          issues.push({
            ...baseIssue,
            message: 'Parámetro envenenado: Se declaró un argumento como any. Propaga pérdida de tipos al interior de la función.',
            severity: 'error',
          });
        } else if (
          parent.kind === ts.SyntaxKind.FunctionDeclaration ||
          parent.kind === ts.SyntaxKind.MethodDeclaration ||
          parent.kind === ts.SyntaxKind.ArrowFunction ||
          parent.kind === ts.SyntaxKind.FunctionExpression
        ) {
          issues.push({
            ...baseIssue,
            message: 'Fuga de retorno: La función retorna explícitamente any. El llamador pierde la seguridad de tipos.',
            severity: 'error',
          });
        } else if (parent.kind === ts.SyntaxKind.TypeReference) {
          issues.push({
            ...baseIssue,
            message: 'Genérico camuflado: any como argumento genérico (ej. Promise<any>). Usa un tipo concreto o unknown.',
          });
        } else {
          issues.push({
            ...baseIssue,
            message: 'Uso explícito de any en declaración. Prefiere unknown o un tipo específico.',
          });
        }
      }
    }

    // Regla Semántica: Any invisible inferido por APIs sin tipo (ej: JSON.parse)
    if (checker && ts.isVariableDeclaration(node) && node.initializer && !node.type) {
      const type = checker.getTypeAtLocation(node.initializer);
      // Validar si el tipo resultante es Any intrínseco (TypeFlags.Any = 1)
      if (type.flags & ts.TypeFlags.Any) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        issues.push({
          file: fileName,
          line: line + 1,
          character: character + 1,
          message: `Any invisible detectado: La variable '${node.name.getText()}' infiere 'any' implícitamente de su valor (ej: JSON.parse). Define un tipo explícito o valida con un type guard.`,
          severity: 'warning',
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return issues.filter((issue) => !disabledLines.has(issue.line));
}
