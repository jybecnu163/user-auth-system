const fs = require('fs').promises;
const config = require('../config');

async function readUsers() {
  const data = await fs.readFile(config.DB_PATH, 'utf8');
  return JSON.parse(data).users;
}

async function writeUsers(users) {
  await fs.writeFile(config.DB_PATH, JSON.stringify({ users }, null, 2));
}

async function findUserByUsername(username) {
  const users = await readUsers();
  return users.find(user => user.username === username);
}

async function findUserById(id) {
  const users = await readUsers();
  return users.find(user => user.id === id);
}

module.exports = { readUsers, writeUsers, findUserByUsername, findUserById };
