const fs = require('fs').promises;
const config = require('../config');

async function readSessions() {
  const data = await fs.readFile(config.SESSIONS_DB_PATH, 'utf8');
  return JSON.parse(data);
}

async function writeSessions(data) {
  await fs.writeFile(config.SESSIONS_DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { readSessions, writeSessions };
