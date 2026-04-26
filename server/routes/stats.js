const express = require('express');
const { readUsers } = require('../db/users');
const { readComments } = require('../db/comments');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const users = await readUsers();
    const totalUsers = users.length;
    const commentsData = await readComments();
    let totalComments = 0;
    let totalArticles = 0;
    for (const article of commentsData.articles) {
      totalComments += article.comments.length;
      totalArticles += 1;
    }
    res.json({ totalUsers, totalArticles, totalComments, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ message: '获取统计数据失败' });
  }
});

module.exports = router;
