import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const quotes = [
  "代码如诗，逻辑如画。",
  "保持好奇，永远学习。",
  "简单是可靠的先决条件。",
  "优秀的代码是它自己最好的文档。",
  "今日之我，胜昨日之我。",
  "编程是思考的艺术。",
  "解决问题，而不是写代码。"
];

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [currentQuote, setCurrentQuote] = useState(quotes[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      setCurrentQuote(quotes[randomIndex]);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-quote">{currentQuote}</div>
      <div className="header-user">
        <span>👤 {user?.username}</span>
        <button onClick={handleLogout} className="logout-btn">退出</button>
      </div>
    </header>
  );
};
export default Header;