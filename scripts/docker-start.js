const { spawnSync } = require('node:child_process');

const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://postgres:notabigsecret@localhost:5432/promocodes?schema=public';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
    shell: process.platform === 'win32',
    stdio: options.stdio ?? 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function waitForPostgres() {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    const result = spawnSync(
      'docker',
      ['compose', 'exec', '-T', 'db', 'pg_isready', '-U', 'postgres', '-d', 'promocodes'],
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

run('docker', ['compose', 'up', '-d', 'db']);
waitForPostgres();
run('npx', ['prisma', 'migrate', 'deploy']);
run('docker', ['compose', 'up', '--build', 'api']);
