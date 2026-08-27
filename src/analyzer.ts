import ts from 'typescript';
import type { Issue } from './types.js';

export function analyzeCode(fileName: string, code: string): Issue[] {
  const issues: Issue[] = [];
  const visitedComments = new Set<number>();

  const sourceFile = ts.createSourceFile(
    fileName,
    code,
    ts.ScriptTarget.Latest,
    true
  );

  function walk(node: ts.Node) {
    const sourceFile = node.getSourceFile();
    const nodeStart = node.getStart(sourceFile);
    const position = sourceFile.getLineAndCharacterOfPosition(nodeStart);

    // 1. Detección de comentarios de supresión (@ts-ignore, etc.)
    const fullText = sourceFile.getFullText();
    const commentRanges = ts.getLeadingCommentRanges(fullText, node.pos);

    if (commentRanges) {
      for (const range of commentRanges) {
        if (visitedComments.has(range.pos)) continue;
        visitedComments.add(range.pos);

        const commentText = fullText.substring(range.pos, range.end);
        const DIRECTIVE_REGEX = /^\s*(\/\/|\/\*)\s*@(ts-ignore|ts-expect-error|ts-nocheck)/;
        const match = commentText.match(DIRECTIVE_REGEX);

        if (match) {
          const directiveName = `@${match[2]}`;
          const commentPosition = sourceFile.getLineAndCharacterOfPosition(range.pos);

          issues.push({
            file: sourceFile.fileName,
            line: commentPosition.line + 1,
            character: commentPosition.character + 1,
            message: `Trampa crítica: Uso de comentario de supresión (${directiveName})`,
            severity: 'error',
          });
        }
      }
    }

    // 2. Detección de doble casteo (as any as Type)
    if (ts.isAsExpression(node)) {
      const innerExpression = node.expression;

      if (ts.isAsExpression(innerExpression)) {
        const innerTypeKind = innerExpression.type.kind;

        const isAnyOrUnknown =
          innerTypeKind === ts.SyntaxKind.AnyKeyword ||
          innerTypeKind === ts.SyntaxKind.UnknownKeyword;

        if (isAnyOrUnknown) {
          issues.push({
            file: sourceFile.fileName,
            line: position.line + 1,
            character: position.character + 1,
            message: 'Trampa crítica: Doble casteo detectado (bypass de tipos)',
            severity: 'error',
          });
        }
      }
    }

    // 3. Detección de any explícito
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      issues.push({
        file: sourceFile.fileName,
        line: position.line + 1,
        character: position.character + 1,
        message: 'Trampa detectada: uso explícito de any',
        severity: 'warning',
      });
    }

    ts.forEachChild(node, walk);
  }

  walk(sourceFile);
  return issues;
}
