const path = require('path');
const net = require('net');
const Pg = require('embedded-postgres').default;

function isPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function ensureDb() {
  const port = 5432;
  const dbDir = path.resolve(__dirname, '../.pgdata');
  const pg = new Pg({
    port,
    databaseDir: dbDir,
    user: 'postgres',
    password: 'password',
    persistent: true,
  });

  const alreadyRunning = await isPortOpen(port);
  if (!alreadyRunning) {
    console.log('Starting embedded PostgreSQL on port 5432...');
    try {
      await pg.initialise();
    } catch {
      // already initialized
    }
    await pg.start();
    console.log('PostgreSQL started.');
  } else {
    console.log('PostgreSQL is already running on port 5432.');
  }

  try {
    await pg.createDatabase('washx');
    console.log('Database washx created or already exists.');
  } catch (err) {
    console.log('createDatabase result:', err.message || err);
  }

  return pg;
}

if (require.main === module) {
  ensureDb().then(() => {
    console.log('DB readiness check complete.');
    process.stdin.resume();
  }).catch((err) => {
    console.error('Failed to ensure DB:', err);
    process.exit(1);
  });
}

module.exports = { ensureDb, isPortOpen };
