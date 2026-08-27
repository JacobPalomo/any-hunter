import fs from 'node:fs';
import { c } from './colors.js';

export function runInit() {
  const configPath = '.anyhunterrc.json';

  if (fs.existsSync(configPath)) {
    console.log(`${c.yellow}⚠️  El archivo ${configPath} ya existe.${c.reset}`);
    process.exit(0);
  }

  const defaultConfig = {
    threshold: 85,
    exclude: [
      "**/*.test.ts",
      "**/*.spec.ts",
      "node_modules/**",
      "dist/**"
    ],
    tsconfig: "./tsconfig.json"
  };

  try {
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    console.log(`${c.green}✨ Archivo ${c.bold}${configPath}${c.reset}${c.green} generado exitosamente.${c.reset}`);
    console.log(`${c.dim}Ahora puedes personalizar tus umbrales y reglas de exclusión.${c.reset}\n`);
    process.exit(0);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${c.red}❌ Error al crear el archivo: ${msg}${c.reset}`);
    process.exit(1);
  }
}
