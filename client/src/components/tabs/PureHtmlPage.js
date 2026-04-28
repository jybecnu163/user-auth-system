// client/src/components/tabs/PureHtmlPage.js
import React from 'react';

const PureHtmlPage = ({ htmlFile }) => {
  // 构造文件路径（public 目录下的文件）
  const src = htmlFile ? `${process.env.PUBLIC_URL}/${htmlFile}` : '';

  return (
    <div className="tab-container pure-html-container">
      {src ? (
        <iframe
          title="Embedded HTML"
          src={src}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      ) : (
        <div style={{ padding: 20 }}>未指定 HTML 文件</div>
      )}
    </div>
  );
};

export default PureHtmlPage;