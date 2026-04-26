import React, { useState } from 'react';

const CodeExecutor = () => {
  const [html, setHtml] = useState('<h1>Hello World</h1><p>编辑HTML/CSS/JS代码试试</p>');
  const [output, setOutput] = useState('');

  const runCode = () => {
    setOutput(html);
  };

  return (
    <div className="tab-container code-executor">
      <h2>页面代码执行器（HTML/CSS/JS）</h2>
      <textarea
        value={html}
        onChange={(e) => setHtml(e.target.value)}
        rows="10"
        style={{ width: '100%', fontFamily: 'monospace' }}
      />
      <button onClick={runCode}>运行 ▶</button>
      <div className="output-area">
        <h3>预览结果：</h3>
        <iframe
          title="code-preview"
          srcDoc={output}
          sandbox="allow-same-origin allow-scripts"
          style={{ width: '100%', height: '300px', border: '1px solid #ddd' }}
        />
      </div>
    </div>
  );
};
export default CodeExecutor;