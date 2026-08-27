import ts from 'typescript'
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCode } from './analyzer.js';
import { isExcluded } from './project.js';
import fs from 'node:fs';
import { loadConfigFile } from './config.js';
import { analyzeCode as apiAnalyzeCode, isExcluded as apiIsExcluded } from './api.js';

describe('Programmatic API Exports', () => {
  test('debe exponer analyzeCode correctamente desde el entrypoint api.js', () => {
    const issues = apiAnalyzeCode('test.ts', 'let x: any = 1;');
    assert.equal(issues.length, 1);
    assert.equal(issues[0]?.severity, 'warning');
  });

  test('debe exponer isExcluded correctamente desde el entrypoint api.js', () => {
    assert.equal(apiIsExcluded('src/app.test.ts', ['*.test.ts']), true);
  });
});

describe('any-hunter AST Analyzer', () => {
  test('debe detectar el uso explícito de any', () => {
    const code = 'let x: any = 10;';
    const issues = analyzeCode('test.ts', code);

    assert.equal(issues.length, 1);
    assert.equal(issues[0]!.severity, 'warning');
    assert.match(issues[0]!.message, /uso explícito de any/i);
  });

  test('debe detectar casteo forzado directo (as any)', () => {
    const code = 'const res = obj as any;';
    const issues = analyzeCode('test.ts', code);

    assert.equal(issues.length, 1);
    assert.equal(issues[0]!.severity, 'warning');
    assert.match(issues[0]!.message, /Casteo forzado a any/);
  });

  test('debe detectar non-null assertion operator (!)', () => {
    const code = 'const length = user!.profile!.name.length;';
    const issues = analyzeCode('test.ts', code);

    assert.equal(issues.length, 2);
    assert.equal(issues[0]!.severity, 'warning');
    assert.match(issues[0]!.message, /non-null assertion/);
  });

  test('debe detectar doble casteo (as any as Type)', () => {
    const code = 'const res = (value as any as string);';
    const issues = analyzeCode('test.ts', code);

    const doubleCast = issues.find((i) => i.message.includes('Doble casteo'));
    assert.ok(doubleCast);
    assert.equal(doubleCast.severity, 'error');
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

  test('debe detectar any oculto en parámetros de funciones (Parámetros envenenados)', () => {
    const code = 'function procesar(data: any, options: string) {}';
    const issues = analyzeCode('test.ts', code);
    assert.equal(issues.length, 1);
    assert.equal(issues[0]!.severity, 'error');
    assert.match(issues[0]!.message, /Parámetro envenenado/);
  });

  test('debe detectar any en tipos de retorno (Fugas de retorno)', () => {
    const code = 'const fetchUser = (): any => { return {}; }';
    const issues = analyzeCode('test.ts', code);
    assert.equal(issues.length, 1);
    assert.equal(issues[0]!.severity, 'error');
    assert.match(issues[0]!.message, /Fuga de retorno/);
  });

  test('debe detectar any escondido en genéricos (Genéricos camuflados)', () => {
    const code = 'let list: Array<any> = []; const req: Promise<any> = api();';
    const issues = analyzeCode('test.ts', code);
    assert.equal(issues.length, 2);
    assert.match(issues[0]!.message, /Genérico camuflado/);
    assert.match(issues[1]!.message, /Genérico camuflado/);
  });
});

describe('isExcluded pattern matcher', () => {
  test('debe ignorar archivos que coincidan con comodín de extensión (*.test.ts)', () => {
    assert.equal(isExcluded('/src/components/Button.test.ts', ['*.test.ts']), true);
    assert.equal(isExcluded('/src/components/Button.ts', ['*.test.ts']), false);
  });

  test('debe ignorar carpetas recursivas (** / legacy / **)', () => {
    assert.equal(isExcluded('/project/src/legacy/oldModule.ts', ['**/legacy/**']), true);
    assert.equal(isExcluded('/project/src/core/newModule.ts', ['**/legacy/**']), false);
  });

  test('debe ignorar múltiples patrones combinados', () => {
    const patterns = ['*.spec.ts', 'dist/**', '**/mocks/**'];
    assert.equal(isExcluded('/app/src/mocks/user.ts', patterns), true);
    assert.equal(isExcluded('/app/dist/bundle.js', patterns), true);
    assert.equal(isExcluded('/app/src/index.ts', patterns), false);
  });
});

describe('loadConfigFile', () => {
  const tempConfigPath = './temp.anyhunterrc.json';

  test('debe retornar configuración vacía si el archivo no existe', () => {
    const result = loadConfigFile('inexistente.json');
    assert.deepEqual(result.config, {});
    assert.equal(result.configFilePath, null);
  });

  test('debe parsear correctamente un archivo de configuración válido', () => {
    fs.writeFileSync(
      tempConfigPath,
      JSON.stringify({ threshold: 92, exclude: ['**/*.spec.ts'] })
    );

    try {
      const result = loadConfigFile(tempConfigPath);
      assert.equal(result.config.threshold, 92);
      assert.deepEqual(result.config.exclude, ['**/*.spec.ts']);
      assert.equal(result.configFilePath, tempConfigPath);
    } finally {
      fs.unlinkSync(tempConfigPath);
    }
  });
});

test('debe ignorar advertencias si la línea anterior tiene // any-hunter-disable-next-line', () => {
  const code = `
    // any-hunter-disable-next-line
    let x: any = 1;
    let y: any = 2;
  `;
  const issues = analyzeCode('test.ts', code);

  // Solo debe encontrar el error de 'y' en la línea 4
  assert.equal(issues.length, 1);
  assert.equal(issues[0]!.line, 4);
  assert.match(issues[0]!.message, /uso explícito de any/i);
});

test('debe detectar any invisible proveniente de llamadas que retornan any (JSON.parse)', () => {
    // Creamos un program en memoria para probar el TypeChecker
    const source = 'const parsedData = JSON.parse("{\\"a\\": 1}");';
    const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);

    const host: ts.CompilerHost = {
      getSourceFile: (name) => (name === 'test.ts' ? sourceFile : undefined),
      getDefaultLibFileName: () => 'lib.d.ts',
      writeFile: () => {},
      getCurrentDirectory: () => '',
      getCanonicalFileName: (f) => f,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => '\n',
      fileExists: (f) => f === 'test.ts',
      readFile: () => '',
    };

    const program = ts.createProgram(['test.ts'], { target: ts.ScriptTarget.Latest }, host);
    const checker = program.getTypeChecker();

    const issues = analyzeCode('test.ts', sourceFile, checker);
    const invisibleAny = issues.find((i) => i.message.includes('Any invisible detectado'));

    assert.ok(invisibleAny);
    assert.match(invisibleAny.message, /parsedData/);
  });
