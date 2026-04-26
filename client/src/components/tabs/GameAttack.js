// client/src/components/tabs/Game.js (最终无警告版)
import React, { useEffect, useRef, useState, useCallback } from 'react';

const Game = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState({ score: 0, gameOver: false });
  const gameStateRef = useRef(gameState);
  const frameRef = useRef(null);
  const keysRef = useRef({});
  const playerRef = useRef({
    x: 400, y: 300, width: 30, height: 30, speed: 5, attacking: false, attackTimer: 0,
  });
  const enemiesRef = useRef([]);
  const itemsRef = useRef([]);

  // 同步 gameState 到 ref
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const initEnemies = useCallback(() => {
    const enemies = [];
    for (let i = 0; i < 5; i++) {
      enemies.push({
        x: Math.random() * 700 + 50,
        y: Math.random() * 500 + 50,
        width: 25, height: 25, hp: 3, type: 'animal',
      });
    }
    enemiesRef.current = enemies;
  }, []);

  const dropItem = useCallback((x, y) => {
    itemsRef.current.push({
      x, y, width: 12, height: 12, type: 'score', value: 10,
    });
  }, []);

  const attack = useCallback(() => {
    const player = playerRef.current;
    if (player.attacking) return;
    player.attacking = true;
    player.attackTimer = 10;
    const attackX = player.x + player.width / 2;
    const attackY = player.y + player.height / 2;

    enemiesRef.current = enemiesRef.current.filter(enemy => {
      const dx = attackX - (enemy.x + enemy.width / 2);
      const dy = attackY - (enemy.y + enemy.height / 2);
      if (Math.sqrt(dx * dx + dy * dy) < 40) {
        enemy.hp--;
        if (enemy.hp <= 0) {
          dropItem(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
          setGameState(prev => ({ ...prev, score: prev.score + 10 }));
          return false;
        }
        return true;
      }
      return true;
    });
  }, [dropItem]);

  const updatePlayer = useCallback(() => {
    const player = playerRef.current;
    const keys = keysRef.current;
    let newX = player.x, newY = player.y;
    if (keys.ArrowUp) newY -= player.speed;
    if (keys.ArrowDown) newY += player.speed;
    if (keys.ArrowLeft) newX -= player.speed;
    if (keys.ArrowRight) newX += player.speed;
    player.x = Math.max(10, Math.min(800 - player.width - 10, newX));
    player.y = Math.max(10, Math.min(600 - player.height - 10, newY));
    if (player.attacking) {
      player.attackTimer--;
      if (player.attackTimer <= 0) player.attacking = false;
    }
  }, []);

  const updateItems = useCallback(() => {
    const player = playerRef.current;
    itemsRef.current = itemsRef.current.filter(item => {
      const dx = player.x + player.width / 2 - (item.x + item.width / 2);
      const dy = player.y + player.height / 2 - (item.y + item.height / 2);
      if (Math.sqrt(dx * dx + dy * dy) < 25) {
        setGameState(prev => ({ ...prev, score: prev.score + item.value }));
        return false;
      }
      return true;
    });
  }, []);

  const respawnEnemies = useCallback(() => {
    const targetCount = 5;
    const currentCount = enemiesRef.current.length;
    for (let i = currentCount; i < targetCount; i++) {
      enemiesRef.current.push({
        x: Math.random() * 700 + 50,
        y: Math.random() * 500 + 50,
        width: 25, height: 25, hp: 3, type: 'animal',
      });
    }
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // 背景
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0, 0, 800, 600);
    // 草地纹理
    ctx.fillStyle = '#3c7a2f';
    for (let i = 0; i < 200; i++) ctx.fillRect(Math.random() * 800, Math.random() * 600, 2, 2);
    // 树木
    ctx.fillStyle = '#8B5A2B';
    for (let i = 0; i < 15; i++) {
      ctx.fillRect(50 + i * 70, 400, 20, 150);
      ctx.fillStyle = '#2c5e1e';
      ctx.beginPath();
      ctx.arc(60 + i * 70, 390, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8B5A2B';
    }
    // 玩家
    const p = playerRef.current;
    ctx.save();
    if (p.attacking) {
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(p.x + p.width / 2, p.y + p.height / 2);
      ctx.lineTo(p.x + p.width / 2 + 30, p.y + p.height / 2 - 20);
      ctx.stroke();
    }
    ctx.fillStyle = '#FFD966';
    ctx.fillRect(p.x, p.y, p.width, p.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(p.x + 5, p.y + 5, 5, 5);
    ctx.fillRect(p.x + p.width - 10, p.y + 5, 5, 5);
    ctx.beginPath();
    ctx.arc(p.x + p.width / 2, p.y + p.height - 5, 5, 0, Math.PI);
    ctx.fill();
    ctx.restore();
    // 敌人
    enemiesRef.current.forEach(enemy => {
      ctx.fillStyle = '#D2691E';
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      ctx.fillStyle = '#000';
      ctx.fillRect(enemy.x + 5, enemy.y + 5, 4, 4);
      ctx.fillRect(enemy.x + enemy.width - 9, enemy.y + 5, 4, 4);
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(enemy.x, enemy.y - 8, (enemy.width * enemy.hp) / 3, 4);
    });
    // 物品
    itemsRef.current.forEach(item => {
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(item.x, item.y, item.width, item.height);
      ctx.fillStyle = '#FFA500';
      ctx.fillRect(item.x + 2, item.y + 2, item.width - 4, item.height - 4);
    });
    // UI
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`得分: ${gameStateRef.current.score}`, 20, 40);
    ctx.fillText('WASD/方向键移动, A攻击', 20, 70);
  }, []);

  const resetGame = useCallback(() => {
    setGameState({ score: 0, gameOver: false });
    playerRef.current = {
      x: 400, y: 300, width: 30, height: 30, speed: 5, attacking: false, attackTimer: 0,
    };
    enemiesRef.current = [];
    itemsRef.current = [];
    initEnemies();
  }, [initEnemies]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        e.preventDefault();
        keysRef.current[key] = true;
      }
      if (key === 'a' || key === 'A') {
        e.preventDefault();
        attack();
      }
    };
    const handleKeyUp = (e) => {
      const key = e.key;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        keysRef.current[key] = false;
      }
    };
    const gameLoop = () => {
      if (gameStateRef.current.gameOver) return;
      updatePlayer();
      updateItems();
      respawnEnemies();
      drawCanvas();
      frameRef.current = requestAnimationFrame(gameLoop);
    };
    initEnemies();
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    frameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(frameRef.current);
    };
  }, [attack, updatePlayer, updateItems, respawnEnemies, drawCanvas, initEnemies]);

  return (
    <div className="tab-container game-container">
      <h2>火柴人大冒险 - 森林猎手</h2>
      <canvas ref={canvasRef} width={800} height={600} style={{ border: '2px solid #333', borderRadius: '8px' }} />
      <div className="game-controls">
        <button onClick={resetGame}>重新开始</button>
        <p>提示：上下左右键移动，A键攻击。击败动物获得分数，动物死后会掉落金币并重新刷新。</p>
      </div>
    </div>
  );
};

export default Game;