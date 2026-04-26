const express = require('express');
const cors = require('cors');
const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/comments'));
app.use('/api', require('./routes/posts'));
app.use('/api', require('./routes/ollama'));
app.use('/api', require('./routes/sales'));
app.use('/api', require('./routes/stats'));
app.use('/api', require('./routes/mysql'));
app.use('/api', require('./routes/dbConnections'));
app.use('/api', require('./routes/permissions'));
app.use('/api', require('./routes/userTablePermissions'));

module.exports = app;
