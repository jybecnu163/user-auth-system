import React, { useState } from 'react';

const DeepSeekChat = () => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  // const chatUrl = 'https://chat.deepseek.com/';
  const chatUrl = 'https://www.baidu.com/';

  return (
    <div className="tab-container deepseek-container">
      {/* <div className="deepseek-header">
        <h2>🤖 DeepSeek AI 助手</h2>
        <div className="deepseek-info">
          注：由于目标网站的安全策略限制，iframe 嵌入可能被拒绝
        </div>
      </div> */}
      
      {iframeError ? (
        <div className="deepseek-error">
          <div className="error-icon">🔒</div>
          <h3>无法嵌入外部页面</h3>
          <p>
            <strong>https://chat.deepseek.com/</strong> 可能设置了{' '}
            <code>X-Frame-Options</code> 或 <code>CSP frame-ancestors</code> 限制，
            阻止了在 iframe 中加载。
          </p>
          <div className="error-actions">
            <a href={chatUrl} target="_blank" rel="noopener noreferrer" className="open-new-tab">
              在新标签页中打开 DeepSeek
            </a>
          </div>
        </div>
      ) : (
        <div className="iframe-wrapper">
          {!iframeLoaded && (
            <div className="iframe-loading">
              <div className="spinner"></div>
              <p>正在加载 DeepSeek AI 助手...</p>
            </div>
          )}
          <iframe
            src={chatUrl}
            title="DeepSeek AI Chat"
            className="deepseek-iframe"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-same-origin allow-modals"
            onLoad={() => setIframeLoaded(true)}
            onError={() => setIframeError(true)}
            style={{ display: iframeLoaded ? 'block' : 'none' }}
          />
        </div>
      )}
    </div>
  );
};

export default DeepSeekChat;