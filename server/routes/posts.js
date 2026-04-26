const express = require('express');
const { readPosts, writePosts } = require('../db/posts');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

router.get('/posts', async (req, res) => {
  try {
    const posts = await readPosts();
    const sorted = posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sorted);
  } catch (error) {
    console.error('获取文章列表失败:', error);
    res.status(500).json({ message: '获取文章列表失败' });
  }
});

router.get('/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const posts = await readPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return res.status(404).json({ message: '文章不存在' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: '获取文章失败' });
  }
});

router.post('/posts', authenticateToken, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: '标题和内容不能为空' });
    }
    const posts = await readPosts();
    const newPost = {
      id: Date.now().toString(),
      title,
      content,
      author: req.user.username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    posts.push(newPost);
    await writePosts(posts);
    res.status(201).json(newPost);
  } catch (error) {
    console.error('发布文章失败:', error);
    res.status(500).json({ message: '发布文章失败' });
  }
});

module.exports = router;
