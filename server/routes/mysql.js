// server-modular/routes/mysql.js
const express = require('express');
const mysql = require('mysql2/promise');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// 在文件顶部添加必要的引入（如果尚未引入 fs 和 path）
const fs = require('fs').promises;
const path = require('path');
const PERMISSIONS_FILE = path.join(__dirname, '..', 'data', 'user_table_permissions.json');

// 辅助函数：获取用户对特定连接数据库有权限的表名列表
async function getUserAllowedTables(userId, connId, database) {
  try {
    const data = await fs.readFile(PERMISSIONS_FILE, 'utf8');
    const permissions = JSON.parse(data);
    const allowed = permissions
      .filter(p => p.userId === userId && p.connId === connId && p.database === database)
      .map(p => p.table);
    return allowed;
  } catch (err) {
    console.error('读取权限文件失败', err);
    return [];
  }
}

// 测试连接并获取数据库列表
router.post('/mysql/connect', authenticateToken, async (req, res) => {
  const { host, port, user, password } = req.body;
  let connection;
  try {
    connection = await mysql.createConnection({
      host, port: port || 3306, user, password,
      connectTimeout: 5000
    });
    const [rows] = await connection.query('SHOW DATABASES');
    const databases = rows.map(row => row.Database).filter(db => !['information_schema', 'mysql', 'performance_schema', 'sys'].includes(db));
    await connection.end();
    res.json({ success: true, databases });
  } catch (error) {
    console.error('MySQL连接失败:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// 获取指定数据库的表列表
router.post('/mysql/tables', authenticateToken, async (req, res) => {
  const { host, port, user, password, database, connId, userId } = req.body;
  let connection;
  try {
    connection = await mysql.createConnection({
      host, port: port || 3306, user, password, database
    });
    // const [rows] = await connection.query('SHOW TABLES');
    // const tables = rows.map(row => Object.values(row)[0]);
    // await connection.end();
    // res.json({ success: true, tables });

    const [rows] = await connection.query('SHOW TABLES');
    let allTables = rows.map(row => Object.values(row)[0]);
    let tables = allTables;
    // 如果提供了 connId 和 userId，则过滤出用户有权限的表
    if (connId && userId) {
      const allowedTables = await getUserAllowedTables(userId, connId, database);
      tables = allTables.filter(t => allowedTables.includes(t));
    }
    await connection.end();
    res.json({ success: true, tables });

  } catch (error) {
    console.error('获取表列表失败:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// 执行SQL查询（支持分页）
router.post('/mysql/query', authenticateToken, async (req, res) => {
  const { host, port, user, password, database, sql, page = 1, pageSize = 10 } = req.body;
  let connection;
  try {
    connection = await mysql.createConnection({
      host, port: port || 3306, user, password, database,
      connectTimeout: 10000
    });
    // 分页处理：自动添加 LIMIT 和 OFFSET，但仅当sql是SELECT语句且不包含LIMIT子句时
    let finalSql = sql.trim();
    const isSelect = /^select/i.test(finalSql);
    if (isSelect && !/limit\s+/i.test(finalSql)) {
      const offset = (page - 1) * pageSize;
      finalSql = `${finalSql} LIMIT ${pageSize} OFFSET ${offset}`;
    }
    const [rows, fields] = await connection.query(finalSql);
    // 获取总记录数（用于分页）
    let total = rows.length;
    if (isSelect && !/limit\s+/i.test(sql)) {
      const countSql = `SELECT COUNT(*) as total FROM (${sql}) as subquery`;
      try {
        const [countRows] = await connection.query(countSql);
        total = countRows[0].total;
      } catch (err) {
        // 如果复杂SQL无法计数，则使用当前返回行数作为总数
        total = rows.length;
      }
    }
    await connection.end();
    res.json({
      success: true,
      data: rows,
      fields: fields.map(f => f.name),
      total,
      page,
      pageSize
    });
  } catch (error) {
    console.error('SQL执行失败:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

module.exports = router;