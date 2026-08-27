import path from 'node:path';
import type { Issue } from './types.js';

export function generateSarif(issues: Issue[]) {
  return {
    version: '2.1.0',
    $schema: 'http://json.schemastore.org/sarif-2.1.0-rtm.5',
    runs: [
      {
        tool: {
          driver: {
            name: 'Any-Hunter',
            informationUri: 'https://github.com/JacobPalomo/any-hunter',
            rules: [
              {
                id: 'any-hunter-error',
                shortDescription: { text: 'Trampa crítica en sistema de tipos (any-hunter)' }
              },
              {
                id: 'any-hunter-warning',
                shortDescription: { text: 'Advertencia en sistema de tipos (any-hunter)' }
              }
            ]
          }
        },
        results: issues.map((issue) => {
          const ruleId = issue.severity === 'error' ? 'any-hunter-error' : 'any-hunter-warning';
          const relativePath = path.relative(process.cwd(), issue.file).replace(/\\/g, '/');

          return {
            ruleId,
            level: issue.severity === 'error' ? 'error' : 'warning',
            message: { text: issue.message },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: { uri: relativePath },
                  region: { startLine: issue.line, startColumn: issue.character }
                }
              }
            ]
          };
        })
      }
    ]
  };
}
