// client/src/components/tabs/OllamaTest.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  getOllamaModels,
  ollamaGenerate,
  getSessions,
  getSession,
  createSession,
  addMessageToSession,
  updateSessionTitle,
  deleteSession
} from '../../api';

const OllamaTest = () => {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [system, setSystem] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentMessages, setCurrentMessages] = useState([]);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const messagesEndRef = useRef(null);

  // 加载模型列表
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await getOllamaModels();
        const modelList = res.data.models || [];
        setModels(modelList);
        if (modelList.length) setSelectedModel(modelList[0].name);
      } catch (error) {
        console.error('获取模型失败', error);
      }
    };
    fetchModels();
  }, []);

  // 加载会话列表
  const loadSessions = useCallback(async () => {
    try {
      const res = await getSessions();
      setSessions(res.data);
    } catch (error) {
      console.error('加载会话列表失败', error);
    }
  }, []);

  // 加载指定会话内容
  const loadSession = useCallback(async (sessionId) => {
    try {
      const res = await getSession(sessionId);
      setCurrentSessionId(sessionId);
      setCurrentMessages(res.data.messages || []);
    } catch (error) {
      console.error('加载会话失败', error);
    }
  }, []);

  // 创建新会话
  const createNewSession = async () => {
    try {
      const res = await createSession('新对话');
      await loadSessions();
      setCurrentSessionId(res.data.id);
      setCurrentMessages([]);
      return res.data.id;
    } catch (error) {
      console.error('创建会话失败:', error);
      alert('创建会话失败，请检查后端服务');
      return null;
    }
  };

  // 删除会话
  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    if (!window.confirm('确定要删除这个会话吗？')) return;
    try {
      await deleteSession(sessionId);
      await loadSessions();
      if (currentSessionId === sessionId) {
        // 如果删除的是当前会话，尝试选中第一个会话或清空
        const remaining = sessions.filter(s => s.id !== sessionId);
        if (remaining.length > 0) {
          loadSession(remaining[0].id);
        } else {
          setCurrentSessionId(null);
          setCurrentMessages([]);
        }
      }
    } catch (error) {
      console.error('删除会话失败:', error);
      alert('删除会话失败');
    }
  };

  // 开始编辑标题
  const startEditTitle = (sessionId, currentTitle, e) => {
    e.stopPropagation();
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle);
  };

  // 保存编辑后的标题
  const saveTitle = async (sessionId) => {
    if (!editingTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    try {
      await updateSessionTitle(sessionId, editingTitle.trim());
      await loadSessions();
      // 如果编辑的是当前会话，刷新当前会话显示（标题变化不影响消息内容）
      if (currentSessionId === sessionId) {
        // 重新加载当前会话（保持消息不变）
        loadSession(sessionId);
      }
    } catch (error) {
      console.error('修改标题失败:', error);
      alert('修改标题失败');
    } finally {
      setEditingSessionId(null);
    }
  };

  // 处理回车保存
  const handleTitleKeyPress = (e, sessionId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTitle(sessionId);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // 当会话列表加载完成后，如果没有当前会话且有会话，自动选中第一个
  useEffect(() => {
    if (sessions.length > 0 && !currentSessionId) {
      loadSession(sessions[0].id);
    }
  }, [sessions, currentSessionId, loadSession]);

  // 发送消息
  const handleGenerate = async () => {
    if (!selectedModel || !prompt.trim()) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      const newId = await createNewSession();
      if (!newId) return;
      sessionId = newId;
    }

    const userContent = prompt;
    setPrompt('');
    const userMsg = { role: 'user', content: userContent, id: Date.now().toString() };
    setCurrentMessages(prev => [...prev, userMsg]);

    try {
      await addMessageToSession(sessionId, 'user', userContent);
    } catch (error) {
      console.error('保存用户消息失败', error);
    }

    setLoading(true);
    try {
      const res = await ollamaGenerate(selectedModel, userContent, system);
      const aiContent = res.data.response || '无响应内容';
      const aiMsg = { role: 'assistant', content: aiContent, id: (Date.now() + 1).toString() };
      setCurrentMessages(prev => [...prev, aiMsg]);
      await addMessageToSession(sessionId, 'assistant', aiContent);
      await loadSessions(); // 刷新会话列表（可能标题更新）
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      const errorAiMsg = { role: 'assistant', content: `错误：${errorMsg}`, id: (Date.now() + 1).toString() };
      setCurrentMessages(prev => [...prev, errorAiMsg]);
      await addMessageToSession(sessionId, 'assistant', `错误：${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  return (
    <div className="tab-container ollama-test">
      <h2>Ollama 本地模型测试</h2>

      <div className="ollama-row">
        <div className="ollama-field">
          <label>选择模型：</label>
          <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
            {models.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
          </select>
          {models.length === 0 && <span className="error-message">未检测到Ollama服务</span>}
        </div>
        <div className="ollama-field">
          <label>系统提示（可选）：</label>
          <input
            type="text"
            value={system}
            onChange={(e) => setSystem(e.target.value)}
            placeholder="例如：你是一个助手"
          />
        </div>
      </div>

      <div className="ollama-two-columns">
        {/* 左侧会话列表 */}
        <div className="ollama-session-list">
          <div className="session-header">
            <h4>历史会话</h4>
            <button onClick={createNewSession} className="new-session-btn">+ 新会话</button>
          </div>
          <ul className="session-items">
            {sessions.map(s => (
              <li
                key={s.id}
                className={`session-item ${currentSessionId === s.id ? 'active' : ''}`}
                onClick={() => loadSession(s.id)}
              >
                {editingSessionId === s.id ? (
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => saveTitle(s.id)}
                    onKeyPress={(e) => handleTitleKeyPress(e, s.id)}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    className="session-title-input"
                  />
                ) : (
                  <>
                    <div className="session-title">{s.title}</div>
                    <div className="session-info">
                      <span className="session-date">{new Date(s.updatedAt).toLocaleString()}</span>
                      <div className="session-actions">
                        <button
                          onClick={(e) => startEditTitle(s.id, s.title, e)}
                          className="session-edit-btn"
                          title="编辑标题"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => handleDeleteSession(s.id, e)}
                          className="session-delete-btn"
                          title="删除会话"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </li>
            ))}
            {sessions.length === 0 && <div className="no-sessions">暂无会话，开始新对话</div>}
          </ul>
        </div>

        {/* 右侧对话区域 */}
        <div className="ollama-conversation-area">
          <div className="ollama-conversation">
            {currentMessages.length === 0 ? (
              <div className="conversation-empty">暂无对话，输入问题开始聊天</div>
            ) : (
              currentMessages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  <div className="message-role">{msg.role === 'user' ? '👤 用户' : '🤖 AI'}</div>
                  <div className="message-content">{msg.content}</div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ollama-input-area">
            <textarea
              className="ollama-prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入您的问题... (Shift+Enter 换行，Enter 发送)"
              rows="3"
              disabled={loading}
            />
            <button
              className="ollama-generate-btn"
              onClick={handleGenerate}
              disabled={loading || !selectedModel || !prompt.trim()}
            >
              {loading ? '生成中...' : '生成答案'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OllamaTest;