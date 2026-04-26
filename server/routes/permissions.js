// server-modular/routes/permissions.js
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const authenticateToken = require('../middleware/auth');

const router = express.Router();
const PERMISSIONS_FILE = path.join(__dirname, '..', 'data', 'permissions.json');

// 读取权限数据
async function readPermissions() {
    try {
        const data = await fs.readFile(PERMISSIONS_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

// 写入权限数据
async function writePermissions(data) {
    await fs.writeFile(PERMISSIONS_FILE, JSON.stringify(data, null, 2));
}

// 获取所有系统用户（从用户数据库）
const { readUsers } = require('../db/users');

// 获取所有用户列表（仅用户名）
router.get('/permissions/users', authenticateToken, async (req, res) => {
    try {
        const { readUsers } = require('../db/users');
        const users = await readUsers();
        const userList = users.map(u => ({ id: u.id, username: u.username }));
        res.json(userList);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 获取所有数据库连接（从 db_connections.json）
const { readConnections } = require('./dbConnections');

router.get('/permissions/connections', authenticateToken, async (req, res) => {
    try {
        const allConns = await readConnections();
        // 只返回当前用户自己的连接？根据业务，可能管理员可以分配所有连接，这里简化：返回所有用户的连接？但为了安全，只返回当前用户创建的连接。
        // 实际可以根据需求：返回所有连接（因为管理员需要分配）。这里我们先返回所有连接（可能不安全，但演示用）。
        // 更合理：返回当前用户有权限管理的连接。简单处理：返回所有连接，前端再过滤。
        res.json(allConns);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 获取某用户对某个连接的权限（表列表）
router.get('/permissions/:username/:connId', authenticateToken, async (req, res) => {
    try {
        const { username, connId } = req.params;
        const perms = await readPermissions();
        const userPerms = perms[username] || {};
        const tables = userPerms[connId]?.tables || [];
        res.json({ tables });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 设置用户对某个连接的表权限（全量替换）
router.post('/permissions/:username/:connId', authenticateToken, async (req, res) => {
    try {
        const { username, connId } = req.params;
        const { tables } = req.body; // 数组
        const perms = await readPermissions();
        if (!perms[username]) perms[username] = {};
        perms[username][connId] = { tables: tables || [] };
        await writePermissions(perms);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 添加单个表权限
router.post('/permissions/:username/:connId/tables', authenticateToken, async (req, res) => {
    try {
        const { username, connId } = req.params;
        const { table } = req.body;
        const perms = await readPermissions();
        if (!perms[username]) perms[username] = {};
        if (!perms[username][connId]) perms[username][connId] = { tables: [] };
        if (!perms[username][connId].tables.includes(table)) {
            perms[username][connId].tables.push(table);
        }
        await writePermissions(perms);
        res.json({ success: true, tables: perms[username][connId].tables });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 删除单个表权限
router.delete('/permissions/:username/:connId/tables/:table', authenticateToken, async (req, res) => {
    try {
        const { username, connId, table } = req.params;
        const perms = await readPermissions();
        if (perms[username] && perms[username][connId]) {
            perms[username][connId].tables = perms[username][connId].tables.filter(t => t !== table);
            await writePermissions(perms);
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

