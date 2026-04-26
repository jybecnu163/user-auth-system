const express = require('express');
const config = require('../config');
const { readSessions, writeSessions } = require('../db/sessions');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// 获取模型列表
router.get('/ollama/models', async (req, res) => {
  try {
    const response = await fetch(`${config.OLLAMA_API_URL}/api/tags`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Ollama连接失败:', error);
    res.status(500).json({ message: '无法连接到Ollama服务，请确保Ollama正在运行' });
  }
});

// 生成回答
router.post('/ollama/generate', async (req, res) => {
  try {
    const { model, prompt, system } = req.body;
    const response = await fetch(`${config.OLLAMA_API_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, system, stream: false })
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Ollama请求失败' });
  }
});

// 获取会话列表
router.get('/ollama/sessions', authenticateToken, async (req, res) => {
  try {
    const db = await readSessions();
    const userSessions = db[req.user.username] || [];
    const list = userSessions.map(s => ({
      id: s.id,
      title: s.title,
      updatedAt: s.updatedAt
    })).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json(list);
  } catch (error) {
    console.error('获取会话列表失败:', error);
    res.status(500).json({ message: '获取会话列表失败' });
  }
});

// 获取特定会话
router.get('/ollama/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const db = await readSessions();
    const userSessions = db[req.user.username] || [];
    const session = userSessions.find(s => s.id === sessionId);
    if (!session) return res.status(404).json({ message: '会话不存在' });
    res.json(session);
  } catch (error) {
    console.error('获取会话失败:', error);
    res.status(500).json({ message: '获取会话失败' });
  }
});

// 创建会话
router.post('/ollama/sessions', authenticateToken, async (req, res) => {
  try {
    const { title } = req.body;
    const db = await readSessions();
    if (!db[req.user.username]) db[req.user.username] = [];
    const newSession = {
      id: Date.now().toString(),
      title: title || '新对话',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };
    db[req.user.username].push(newSession);
    await writeSessions(db);
    res.status(201).json(newSession);
  } catch (error) {
    console.error('创建会话失败:', error);
    res.status(500).json({ message: '创建会话失败：' + error.message });
  }
});

// 添加消息到会话
router.post('/ollama/sessions/:sessionId/messages', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { role, content } = req.body;
    if (!role || !content) return res.status(400).json({ message: '消息角色和内容不能为空' });
    const db = await readSessions();
    const userSessions = db[req.user.username];
    if (!userSessions) return res.status(404).json({ message: '用户无会话' });
    const sessionIndex = userSessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) return res.status(404).json({ message: '会话不存在' });
    const session = userSessions[sessionIndex];
    session.messages.push({
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date().toISOString()
    });
    session.updatedAt = new Date().toISOString();
    if (session.title === '新对话' && role === 'user' && session.messages.length === 1) {
      let newTitle = content.substring(0, 30);
      if (content.length > 30) newTitle += '...';
      session.title = newTitle;
    }
    await writeSessions(db);
    res.json({ message: '添加成功', session });
  } catch (error) {
    console.error('添加消息失败:', error);
    res.status(500).json({ message: '添加消息失败：' + error.message });
  }
});

// 修改会话标题
router.put('/ollama/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: '标题不能为空' });
    
    const db = await readSessions();
    const userSessions = db[req.user.username];
    if (!userSessions) return res.status(404).json({ message: '用户无会话' });
    
    const session = userSessions.find(s => s.id === sessionId);
    if (!session) return res.status(404).json({ message: '会话不存在' });
    
    session.title = title;
    session.updatedAt = new Date().toISOString();
    await writeSessions(db);
    res.json({ message: '标题更新成功', session });
  } catch (error) {
    console.error('修改标题失败:', error);
    res.status(500).json({ message: '修改标题失败' });
  }
});

// 删除会话
router.delete('/ollama/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const db = await readSessions();
    const userSessions = db[req.user.username];
    if (!userSessions) return res.status(404).json({ message: '用户无会话' });
    
    const newSessions = userSessions.filter(s => s.id !== sessionId);
    if (newSessions.length === userSessions.length) {
      return res.status(404).json({ message: '会话不存在' });
    }
    db[req.user.username] = newSessions;
    await writeSessions(db);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除会话失败:', error);
    res.status(500).json({ message: '删除会话失败' });
  }
});

module.exports = router;
