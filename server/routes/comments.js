const express = require('express');
const { readComments, writeComments } = require('../db/comments');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

router.get('/comments/:articleId', async (req, res) => {
  try {
    const { articleId } = req.params;
    const db = await readComments();
    const article = db.articles.find(a => a.id === articleId);
    res.json({ comments: article ? article.comments : [] });
  } catch (error) {
    res.status(500).json({ message: '获取评论失败' });
  }
});

router.post('/comments', authenticateToken, async (req, res) => {
  try {
    const { articleId, content } = req.body;
    if (!articleId || !content) return res.status(400).json({ message: '文章ID和内容不能为空' });
    const db = await readComments();
    let article = db.articles.find(a => a.id === articleId);
    if (!article) {
      article = { id: articleId, comments: [] };
      db.articles.push(article);
    }
    const newComment = {
      id: Date.now().toString(),
      username: req.user.username,
      content,
      createdAt: new Date().toISOString()
    };
    article.comments.push(newComment);
    await writeComments(db);
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ message: '发布评论失败' });
  }
});

module.exports = router;
