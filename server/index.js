require('dotenv').config();
const app = require('./app');
const { initAllDatabases } = require('./db/init');
const PORT = process.env.PORT || 5000;

async function startServer() {
  await initAllDatabases();
  app.listen(PORT, () => {
    console.log(`🚀 后端服务运行在 http://localhost:${PORT}`);
  });
}

startServer();
