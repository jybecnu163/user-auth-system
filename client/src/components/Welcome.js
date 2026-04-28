import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Report from './tabs/Report';
import YearBarChart from './tabs/YearBarChart';
import ArticleWithComments from './tabs/ArticleWithComments';
import CodeExecutor from './tabs/CodeExecutor';
import OllamaTest from './tabs/OllamaTest';
import api from '../api';
import GameCenter from './tabs/GameCenter';
// import Game from './tabs/Game';
// import ShootingGame from './tabs/ShootingGame';
import DatabaseQuery from './tabs/DatabaseQuery';
// import DbPermissions from './tabs/DbPermissions';
import PermissionManager from './tabs/PermissionManager';

import DeepSeekChat from './tabs/DeepSeekChat';
// 在文件顶部导入
import PureHtmlPage from './tabs/PureHtmlPage'; 

/**
 * emoji，存一份方便以后使用📂
标志类🎫🔍📌📝📍🎬🎵🅿💰💡🎈💌⏰⌚⏲🎮💎🛎🎶
工作相关📷💼☎🎻📺📻📲📞🛒🌂🛏💄🖌🔒🎥🎞☕🌍🈺
符号类✅☑☑✔❓❗❌⭕💯💤📢🎫
天气☀☁🌧☔
海岛🌊🏝🏖⛱🌅🌄🌙🌇🐟🦐🐚🦀
交通🛵🚅🚄🚢🚙🛳🚚🚗✈🚠🚂🚥🚦🚧⛵🚁🚌
房子🏠🏨💒🏡‍🏫
手势类🙏👍🏻👍🙋👋
情绪类🌈🥳🎊😘✌🍃❗🔥🌞💢🗯💬✨💫
甜点饮料🥞🍹🍷🍻🍵🍸🥤🥃🍰🍞🎂
食物🥢🍴🍽🍚🍜🥣🥘🍔🍳🥩
水果蔬菜🍒🍇🍉🍓🍎🍏🍅🍊🥑🌽🍠🥦🥕🌶🍄
植物🍂🌺🌹💐🥀🌷🌸🍀☘🌵🌿🌱🍃🍁🌾🌳🏵
形状🔸🔹💗💕❤💖❤❤🗯💬🌟
序号0⃣1⃣2⃣3⃣4⃣5⃣6⃣7⃣8⃣9⃣
月亮🌑🌒🌓🌔🌕🌖🌗🌘🌚🌝🌙🌛🌔🌖🌜🌒
其它🚿🚽🧻🛁🛀♨
 */

const tabs = [
  { key: 'report', label: '报表页', icon: '📊' },
  { key: 'chart', label: '年份柱状图', icon: '📈' },
  { key: 'article', label: '文章评论', icon: '✍️' },
  { key: 'code', label: '代码执行器', icon: '💻' },
  { key: 'ollama', label: 'Ollama测试', icon: '🤖' },
  { key: 'gameCenter', label: '游戏中心', icon: '🎮' },
  // { key: 'game', label: '森林游戏', icon: '🎮' },
  // { key: 'shooting', label: '星际射手', icon: '🚀' },
  { key: 'database', label: '数据库查询', icon: '🗄️' },
  // { key: 'permissions', label: '权限管理', icon: '🔐' },
  { key: 'permission', label: '权限管理', icon: '🔐' },
  // { key: 'deepseek', label: 'DeepSeek AI', icon: '🤖' },
  { key: 'deepseek', label: '内嵌百度', icon: '🔍' },
  { key: 'hello', label: '传参内嵌', icon: '📌', htmlFile: 'hello.html' },
  // { key: 'aichat', label: 'AI角色对话', icon: '🤖' },
];

const Welcome = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('report');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/api/user');
        setUser(res.data);
      } catch (err) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'report': return <Report />;
      case 'chart': return <YearBarChart />;
      case 'article': return <ArticleWithComments />;
      case 'code': return <CodeExecutor />;
      case 'ollama': return <OllamaTest />;
      case 'gameCenter': return <GameCenter />;
      // case 'game': return <Game />;
      // case 'shooting': return <ShootingGame />;
      case 'database': return <DatabaseQuery />;
      // case 'permissions': return <DbPermissions />;
      case 'permission': return <PermissionManager />;
      case 'deepseek': return <DeepSeekChat />;
      case 'hello': return <PureHtmlPage htmlFile="hello.html" />;
      // renderContent switch 添加
      // case 'aichat': return <AIChat />;
      default: return <Report />;
    }
  };

  if (loading) return <div className="loading-full">加载中...</div>;

  return (
    <div className="welcome-layout">
      <Sidebar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="main-container">
        <Header user={user} onLogout={handleLogout} />
        <div className="content-area">{renderContent()}</div>
      </div>
    </div>
  );
};
export default Welcome;