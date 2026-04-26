const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const authenticateToken = require('../middleware/auth');

const router = express.Router();
const PERMISSIONS_FILE = path.join(__dirname, '..', 'data', 'user_table_permissions.json');

async function initFile() {
  try {
    await fs.access(PERMISSIONS_FILE);
  } catch {
    await fs.writeFile(PERMISSIONS_FILE, JSON.stringify([], null, 2));
  }
}

async function readPermissions() {
  const data = await fs.readFile(PERMISSIONS_FILE, 'utf8');
  return JSON.parse(data);
}

async function writePermissions(data) {
  await fs.writeFile(PERMISSIONS_FILE, JSON.stringify(data, null, 2));
}

// 获取所有绑定关系
router.get('/user-table-permissions', authenticateToken, async (req, res) => {
  try {
    const perms = await readPermissions();
    res.json(perms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 保存整个绑定关系列表（覆盖式）
router.post('/user-table-permissions', authenticateToken, async (req, res) => {
  try {
    const { permissions } = req.body;
    await writePermissions(permissions);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

initFile();
module.exports = router;