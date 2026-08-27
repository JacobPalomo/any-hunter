import ts from 'typescript';
import type { Issue } from './types.js';

export function analyzeCode(fileName: string, sourceText: string): Issue[] {
  const issues: Issue[] = [];
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true
  );

  // 1. Escanear líneas que tengan el comentario de exclusión local
  const disabledLines = new Set<number>();
  const lines = sourceText.split(/\r\n|\r|\n/);
  lines.forEach((lineText, index) => {
    if (lineText.includes('// any-hunter-disable-next-line')) {
      // index es 0-based. La línea actual es index+1, la siguiente (la ignorada) es index+2
      disabledLines.add(index + 2);
    }
  });

  // 2. Escanear comentarios trivia (@ts-ignore, @ts-expect-error, etc.)
  const fullText = sourceFile.getFullText();
  const triviaRegex = /\/\/\s*(@ts-(?:ignore|expect-error|nocheck))/g;
  let match: RegExpExecArray | null;

  while ((match = triviaRegex.exec(fullText)) !== null) {
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

  // 3. Recorrer el AST para analizar nodos de sintaxis
  function visit(node: ts.Node) {
    // Regla: Non-null assertion operator (ej: item!.value)
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

    // Regla: Doble casteo forzado (ej: x as any as T)
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

    // Regla: Declaración explícita de any (ej: let x: any)
    if (
      node.kind === ts.SyntaxKind.AnyKeyword &&
      node.parent?.kind !== ts.SyntaxKind.AsExpression &&
      node.parent?.kind !== ts.SyntaxKind.TypeAssertionExpression
    ) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      issues.push({
        file: fileName,
        line: line + 1,
        character: character + 1,
        message: 'Se detectó uso explícito de any en una declaración. Prefiere unknown o un tipo específico.',
        severity: 'warning',
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return issues.filter(issue => !disabledLines.has(issue.line));
}
