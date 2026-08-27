import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCode } from './analyzer.js';

describe('any-hunter AST Analyzer', () => {
  test('debe detectar el uso explícito de any', () => {
    const code = 'let x: any = 10;';
    const issues = analyzeCode('test.ts', code);

    assert.equal(issues.length, 1);
    assert.equal(issues[0]!.severity, 'warning');
    assert.match(issues[0]!.message, /uso explícito de any/);
  });

  test('debe detectar doble casteo (as any as Type)', () => {
    const code = 'const res = (value as any as string);';
    const issues = analyzeCode('test.ts', code);

    const doubleCast = issues.find((i) => i.message.includes('Doble casteo'));
    assert.ok(doubleCast);
    assert.equal(doubleCast?.severity, 'error');
  });

  test('debe atrapar directivas @ts-ignore y evitar falsos positivos', () => {
    const code = `
      // @ts-ignore
      const a = 1;
      // Este comentario solo menciona @ts-ignore en texto explicativo
      const b = 2;
    `;
    const issues = analyzeCode('test.ts', code);

    const errorIssues = issues.filter((i) => i.severity === 'error');
    assert.equal(errorIssues.length, 1);
    assert.equal(errorIssues[0]!.line, 2);
  });

  test('debe retornar cero incidencias en código estrictamente tipado', () => {
    const code = 'const total: number = 42; const name: string = "TypeScript";';
    const issues = analyzeCode('test.ts', code);

    assert.equal(issues.length, 0);
  });
});
