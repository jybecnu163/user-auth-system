const fs = require('fs').promises;
const config = require('../config');

async function readComments() {
  const data = await fs.readFile(config.COMMENTS_DB_PATH, 'utf8');
  return JSON.parse(data);
}

async function writeComments(data) {
  await fs.writeFile(config.COMMENTS_DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { readComments, writeComments };
