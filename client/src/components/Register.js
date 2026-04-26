import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    if (formData.password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/register', {
        username: formData.username,
        password: formData.password,
        email: formData.email
      });
      setSuccess('注册成功！3秒后跳转到登录页...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>注册新账户</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名 *</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} required minLength="3" />
          </div>
          <div className="form-group">
            <label>邮箱 (可选)</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>密码 *</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength="6" />
          </div>
          <div className="form-group">
            <label>确认密码 *</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
          </div>
          <button type="submit" disabled={loading} className="auth-button">{loading ? '注册中...' : '注册'}</button>
        </form>
        <p className="auth-link">已有账户？ <Link to="/login">立即登录</Link></p>
      </div>
    </div>
  );
};
export default Register;