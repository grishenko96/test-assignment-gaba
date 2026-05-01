const { spawnSync } = require('node:child_process');
const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const envFilePath = resolve(process.cwd(), '.env.test');

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Missing env file: ${filePath}`);
  }

  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);

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

    process.env[key] = value;
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    env: process.env,
    shell: process.platform === 'win32',
    stdio: options.stdio ?? 'inherit',
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return result.stdout ?? '';
}

function getDatabaseName(databaseUrl) {
  const url = new URL(databaseUrl);
  const databaseName = url.pathname.slice(1);

  if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
    throw new Error(`Unsupported test database name: ${databaseName}`);
  }

  return databaseName;
}

function waitForPostgres() {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    const result = spawnSync(
      'docker',
      ['compose', 'exec', '-T', 'db', 'pg_isready', '-U', 'postgres', '-d', 'postgres'],
      {
        shell: process.platform === 'win32',
        stdio: 'ignore',
      },
    );

    if (result.status === 0) {
      return;
    }

    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
  }

  throw new Error('PostgreSQL did not become ready in time');
}

function ensureTestDatabase(databaseName) {
  const exists = run(
    'docker',
    [
      'compose',
      'exec',
      '-T',
      'db',
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-tAc',
      `SELECT 1 FROM pg_database WHERE datname='${databaseName}'`,
    ],
    { stdio: 'pipe' },
  ).trim();

  if (exists === '1') {
    return;
  }

  run('docker', [
    'compose',
    'exec',
    '-T',
    'db',
    'psql',
    '-U',
    'postgres',
    '-d',
    'postgres',
    '-c',
    `CREATE DATABASE "${databaseName}"`,
  ]);
}

loadEnvFile(envFilePath);

const databaseName = getDatabaseName(process.env.DATABASE_URL);

run('docker', ['compose', 'up', '-d', 'db']);
waitForPostgres();
ensureTestDatabase(databaseName);
run('npx', ['prisma', 'migrate', 'reset', '--force', '--skip-seed']);
run('npx', ['jest', '--config', './test/jest-integration.json', '--runInBand']);
