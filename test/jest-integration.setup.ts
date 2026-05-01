import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envFilePath = resolve(process.cwd(), '.env.test');

if (existsSync(envFilePath)) {
  const lines = readFileSync(envFilePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^"|"$/g, '');

    process.env[key] ??= value;
  }
}

process.env.DATABASE_URL ??=
  'postgresql://postgres:notabigsecret@localhost:5432/promocodes_test?schema=public';
