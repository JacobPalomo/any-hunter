import fs from 'node:fs';
import path from 'node:path';

export interface AnyHunterConfig {
  threshold?: number;
  exclude?: string[];
  tsconfig?: string;
}

export interface LoadedConfig {
  config: AnyHunterConfig;
  configFilePath: string | null;
}

/**
 * Busca y parsea un archivo de configuración .anyhunterrc.json o similar.
 */
export function loadConfigFile(customPath?: string): LoadedConfig {
  const searchPaths = customPath
    ? [customPath]
    : ['.anyhunterrc.json', '.anyhunterrc', 'anyhunter.config.json'];

  for (const relativePath of searchPaths) {
    const fullPath = path.resolve(process.cwd(), relativePath);
    if (fs.existsSync(fullPath)) {
      try {
        const raw = fs.readFileSync(fullPath, 'utf-8');
        const parsed = JSON.parse(raw) as AnyHunterConfig;
        return { config: parsed, configFilePath: relativePath };
      } catch (err) {
        throw new Error(
          `Error al parsear el archivo de configuración "${relativePath}": ${(err as Error).message}`
        );
      }
    }
  }

  return { config: {}, configFilePath: null };
}
