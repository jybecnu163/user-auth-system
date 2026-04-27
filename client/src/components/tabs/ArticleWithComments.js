// client/src/components/tabs/ArticleWithComments.js
import React, { useState, useEffect } from 'react';
import { getPosts, getPost, createPost, getComments, postComment } from '../../api';
import { ollamaGenerate } from '../../api'; // 导入 AI 生成接口

const ArticleWithComments = () => {
  const [posts, setPosts] = useState([]);           // 文章列表
  const [currentPost, setCurrentPost] = useState(null); // 当前选中的文章
  const [comments, setComments] = useState([]);     // 当前文章的评论
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // 发布文章相关状态
  const [showPostForm, setShowPostForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [postLoading, setPostLoading] = useState(false);

  // 加载文章列表
  const loadPosts = async () => {
    try {
      const res = await getPosts();
      setPosts(res.data);
      if (res.data.length > 0 && !currentPost) {
        // 默认选中最新文章（列表已按时间倒序，第一个为最新）
        loadPost(res.data[0].id);
      }
    } catch (error) {
      console.error('加载文章列表失败', error);
    }
  };

  // 加载指定文章详情
  const loadPost = async (postId) => {
    try {
      const res = await getPost(postId);
      setCurrentPost(res.data);
      loadComments(postId);
    } catch (error) {
      console.error('加载文章失败', error);
    }
  };

  // 加载评论
  const loadComments = async (postId) => {
    try {
      const res = await getComments(postId);
      setComments(res.data.comments);
    } catch (error) {
      console.error('加载评论失败', error);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  // 调用 AI 生成回复
  const generateAIReply = async (userComment, postTitle, postContent, previousComments) => {
    // 构建上下文
    const context = `文章标题：${postTitle}\n文章内容：${postContent}\n历史评论：\n${previousComments.map(c => `${c.username}: ${c.content}`).join('\n')}\n用户最新评论：${userComment}\n请作为AI助手，针对用户的评论给出友好、有帮助的回复。回复内容应简洁。`;
    try {
      const res = await ollamaGenerate('qwen2.5-coder:7b', context, '你是一个乐于助人的AI助手。');

      return res.data.response || '抱歉，我暂时无法回答。';
    } catch (error) {
      console.error('AI生成失败', error);
      return 'AI服务暂时不可用，请稍后再试。';
    }
  };


  // 发布评论
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentPost) return;
    const commentText = newComment.trim();
    const isAICall = commentText.startsWith('@AI');
    // 先提交用户评论
    setCommentLoading(true);
    try {
      const res = await postComment(currentPost.id, commentText);
      const userCommentObj = res.data;
      setComments(prev => [...prev, userCommentObj]);
      setNewComment('');

      // 如果是 @AI 调用，则生成并提交 AI 回复
      if (isAICall) {
        setAiGenerating(true);
        const question = commentText.replace(/^@AI\s*/i, '').trim();
        const previousComments = comments; // 不包含刚提交的？可以用更新后的 comments，但需要等待状态更新，使用当前 comments 加上新的
        const allCommentsForAI = [...comments, userCommentObj];
        const reply = await generateAIReply(
          question || '请介绍一下你自己',
          currentPost.title,
          currentPost.content,
          allCommentsForAI
        );
        // 提交 AI 回复作为评论（特殊用户名标记）
        const aiCommentContent = `🤖 AI回复：${reply}`;
        await postComment(currentPost.id, aiCommentContent);
        await loadComments(currentPost.id); // 刷新评论列表
        setAiGenerating(false);
      }
    } catch (error) {
      setAiGenerating(false);
      alert('发布失败，请登录后重试');
    } finally {
      setCommentLoading(false);
    }
  };

  // 发布新文章
  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert('标题和内容不能为空');
      return;
    }
    setPostLoading(true);
    try {
      const res = await createPost(newTitle, newContent);
      // 刷新文章列表，并选中新发布的文章
      await loadPosts();
      // 等待列表更新后选中新文章
      setTimeout(() => {
        loadPost(res.data.id);
      }, 100);
      setShowPostForm(false);
      setNewTitle('');
      setNewContent('');
    } catch (error) {
      alert('发布文章失败：' + (error.response?.data?.message || error.message));
    } finally {
      setPostLoading(false);
    }
  };

  return (
    <div className="tab-container article-with-comments">
      <div className="article-layout">
        {/* 左侧文章列表 */}
        <div className="article-sidebar">
          <div className="sidebar-header">
            <h3>文章列表</h3>
            <button onClick={() => setShowPostForm(!showPostForm)} className="new-post-btn">
              {showPostForm ? '取消' : '+ 发布文章'}
            </button>
          </div>
          {showPostForm && (
            <form onSubmit={handleSubmitPost} className="post-form">
              <input
                type="text"
                placeholder="文章标题"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
              <textarea
                placeholder="文章内容"
                rows="4"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                required
              />
              <button type="submit" disabled={postLoading}>
                {postLoading ? '发布中...' : '发布'}
              </button>
            </form>
          )}
          <ul className="post-list">
            {posts.map(post => (
              <li
                key={post.id}
                className={`post-item ${currentPost?.id === post.id ? 'active' : ''}`}
                onClick={() => loadPost(post.id)}
              >
                <div className="post-title">{post.title}</div>
                <div className="post-meta">
                  {post.author} · {new Date(post.createdAt).toLocaleDateString()}
                </div>
              </li>
            ))}
            {posts.length === 0 && <div className="no-posts">暂无文章，发布第一篇吧</div>}
          </ul>
        </div>

        {/* 右侧文章内容与评论 */}
        <div className="article-content-area">
          {currentPost ? (
            <>
              <div className="post-detail">
                <h2>{currentPost.title}</h2>
                <div className="post-meta">
                  <span>作者：{currentPost.author}</span>
                  <span>发布时间：{new Date(currentPost.createdAt).toLocaleString()}</span>
                </div>
                <div className="post-body">{currentPost.content}</div>
              </div>
              <div className="comments-section">
                <h3>评论 ({comments.length})</h3>
                <ul className="comment-list">
                  {comments.map(c => (
                    <li key={c.id}>
                      <strong>{c.username}</strong>: {c.content}
                      <small>{new Date(c.createdAt).toLocaleString()}</small>
                    </li>
                  ))}
                </ul>
                <form onSubmit={handleSubmitComment} className="comment-form">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="写下你的评论..."
                    rows="3"
                  />
                  <button type="submit" disabled={commentLoading}>
                    {commentLoading ? '发布中...' : '发布评论'}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="no-post-selected">请从左侧选择一篇文章</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleWithComments;