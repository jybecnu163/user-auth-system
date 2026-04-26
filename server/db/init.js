const fs = require('fs').promises;
const config = require('../config');

async function ensureDataDir() {
  try {
    await fs.access(config.DATA_DIR);
  } catch {
    await fs.mkdir(config.DATA_DIR);
  }
}

async function initJsonFile(filePath, defaultContent) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2));
  }
}

async function initAllDatabases() {
  await ensureDataDir();
  await initJsonFile(config.DB_PATH, { users: [] });
  await initJsonFile(config.COMMENTS_DB_PATH, { articles: [] });
  await initJsonFile(config.POSTS_DB_PATH, []);
  await initJsonFile(config.SESSIONS_DB_PATH, {});
}

module.exports = { initAllDatabases, initJsonFile, ensureDataDir };
