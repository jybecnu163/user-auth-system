const fs = require('fs').promises;
const config = require('../config');

async function readPosts() {
  const data = await fs.readFile(config.POSTS_DB_PATH, 'utf8');
  return JSON.parse(data);
}

async function writePosts(posts) {
  await fs.writeFile(config.POSTS_DB_PATH, JSON.stringify(posts, null, 2));
}

module.exports = { readPosts, writePosts };
