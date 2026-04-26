import React, { useState } from 'react';
import Game from './GameAttack';
import ShootingGame from './GameShooting';

const GameCenter = () => {
  const [activeGame, setActiveGame] = useState('forest'); // 'forest' 或 'shooting'

  return (
    <div className="tab-container game-center">
      <div className="game-tabs">
        <button
          className={activeGame === 'forest' ? 'active' : ''}
          onClick={() => setActiveGame('forest')}
        >
          🌲 森林快打
        </button>
        <button
          className={activeGame === 'shooting' ? 'active' : ''}
          onClick={() => setActiveGame('shooting')}
        >
          🚀 星际射手
        </button>
      </div>
      <div className="game-content">
        {activeGame === 'forest' && <Game />}
        {activeGame === 'shooting' && <ShootingGame />}
      </div>
    </div>
  );
};

export default GameCenter;