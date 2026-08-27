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
         const parsed: unknown = JSON.parse(raw);

         if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
           throw new Error('El archivo de configuración debe contener un objeto JSON válido.');
         }

         return { config: parsed as AnyHunterConfig, configFilePath: relativePath };
       } catch (err) {
         const message = err instanceof Error ? err.message : String(err);
         throw new Error(
           `Error al parsear el archivo de configuración "${relativePath}": ${message}`
         );
       }
     }
   }

   return { config: {}, configFilePath: null };
 }
