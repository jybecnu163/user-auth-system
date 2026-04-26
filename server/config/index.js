const path = require('path');

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key_change_me',
  OLLAMA_API_URL: process.env.OLLAMA_API_URL || 'http://localhost:11434',
  DATA_DIR: path.join(__dirname, '..', 'data'),
  DB_PATH: path.join(__dirname, '..', 'data', 'db.json'),
  COMMENTS_DB_PATH: path.join(__dirname, '..', 'data', 'comments.json'),
  POSTS_DB_PATH: path.join(__dirname, '..', 'data', 'posts.json'),
  SESSIONS_DB_PATH: path.join(__dirname, '..', 'data', 'sessions.json'),
};
