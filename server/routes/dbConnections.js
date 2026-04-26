// server-modular/routes/dbConnections.js
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const authenticateToken = require('../middleware/auth');

const router = express.Router();
const CONNECTIONS_FILE = path.join(__dirname, '..', 'data', 'db_connections.json');

// 读取所有保存的连接
async function readConnections() {
  try {
    const data = await fs.readFile(CONNECTIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// 写入连接列表
async function writeConnections(connections) {
  await fs.writeFile(CONNECTIONS_FILE, JSON.stringify(connections, null, 2));
}

// 获取当前用户的连接列表
router.get('/db-connections', authenticateToken, async (req, res) => {
  try {
    const all = await readConnections();
    const userConns = all;//.filter(c => c.username === req.user.username);
    res.json(userConns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 保存或更新连接（存在则更新，不存在则新增）
router.post('/db-connections', authenticateToken, async (req, res) => {
  try {
    const { id, name, host, port, user, password } = req.body;
    if (!host || !user) {
      return res.status(400).json({ message: '主机和用户名不能为空' });
    }
    const all = await readConnections();
    const userConns = all;//.filter(c => c.username === req.user.username);
    const existingIndex = userConns.findIndex(c => c.id === id);
    const newConnection = {
      id: id || Date.now().toString(),
      name: name || `${host}:${port || 3306}`,
      host,
      port: port || 3306,
      user,
      password: password || '',
      username: req.user.username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (existingIndex !== -1) {
      // 更新
      const globalIndex = all.findIndex(c => c.id === id && c.username === req.user.username);
      all[globalIndex] = { ...all[globalIndex], ...newConnection };
    } else {
      all.push(newConnection);
    }
    await writeConnections(all);
    res.json(newConnection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 删除连接
router.delete('/db-connections/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const all = await readConnections();
    const filtered = all.filter(c => !(c.id === id ));//&& c.username === req.user.username
    await writeConnections(filtered);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 文件最后
module.exports = router;
// 然后单独导出函数供其他模块使用
module.exports.readConnections = readConnections;
module.exports.writeConnections = writeConnections;