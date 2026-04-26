// client/src/components/tabs/Report.js
import React, { useState, useEffect } from 'react';
import api from '../../api';

const Report = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalArticles: 0, totalComments: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/stats');
        setStats({
          totalUsers: response.data.totalUsers,
          totalComments: response.data.totalComments,
          totalArticles: response.data.totalArticles
        });
      } catch (err) {
        console.error('获取统计数据失败:', err);
        setError('获取统计数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="tab-container">
        <div className="loading">加载统计数据中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tab-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="tab-container">
      <h2>系统报表</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>注册用户</h3>
          <p>{stats.totalUsers}</p>
        </div>
        <div className="stat-card">
          <h3>总文章数</h3>
          <p>{stats.totalArticles}</p>
        </div>
        <div className="stat-card">
          <h3>总评论数</h3>
          <p>{stats.totalComments}</p>
        </div>
        <div className="stat-card">
          <h3>系统运行</h3>
          <p>正常</p>
        </div>
      </div>
    </div>
  );
};

export default Report;