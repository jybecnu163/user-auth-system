const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { findUserByUsername, readUsers, writeUsers } = require('../db/users');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password) return res.status(400).json({ message: '用户名和密码不能为空' });
    if (username.length < 3) return res.status(400).json({ message: '用户名至少需要3个字符' });
    if (password.length < 6) return res.status(400).json({ message: '密码至少需要6个字符' });

    const existingUser = await findUserByUsername(username);
    if (existingUser) return res.status(409).json({ message: '用户名已被注册' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const users = await readUsers();
    const newUser = {
      id: Date.now().toString(),
      username,
      password: hashedPassword,
      email: email || '',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    await writeUsers(users);
    res.status(201).json({ message: '注册成功，请登录' });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: '用户名和密码不能为空' });

    const user = await findUserByUsername(username);
    if (!user) return res.status(401).json({ message: '用户名或密码错误' });

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(401).json({ message: '用户名或密码错误' });

    const token = jwt.sign({ id: user.id, username: user.username }, config.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/user', authenticateToken, async (req, res) => {
  try {
    const { findUserById } = require('../db/users');
    const user = await findUserById(req.user.id);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    res.json({ id: user.id, username: user.username, email: user.email });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
