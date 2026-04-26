// client/src/components/tabs/ShootingGame.js
import React, { useEffect, useRef, useState, useCallback } from 'react';

const ShootingGame = () => {
  const canvasRef = useRef(null);
  const [gameActive, setGameActive] = useState(false);
  const scoreRef = useRef(0);
  const bulletsCountRef = useRef(1);
  const [, forceUpdate] = useState({});

  const gameActiveRef = useRef(false);
  const gameLoopRef = useRef(null);
  const enemyIntervalRef = useRef(null);
  const shootIntervalRef = useRef(null);
  const keysRef = useRef({});
  const playerRef = useRef({ x: 400, y: 500, width: 40, height: 40 });
  const bulletsRef = useRef([]);
  const enemiesRef = useRef([]);       // 普通敌人
  const bossesRef = useRef([]);        // Boss列表（通常只有一个）
  const frameRef = useRef(0);
  const killCountRef = useRef(0);       // 普通敌人击杀计数（用于触发Boss）

  useEffect(() => {
    gameActiveRef.current = gameActive;
  }, [gameActive]);

  const updateUI = useCallback(() => {
    forceUpdate({});
  }, []);

  const updateBulletCount = useCallback((kills) => {
    let newCount = 1 + Math.floor(kills / 3);
    if (newCount > 6) newCount = 6;
    if (bulletsCountRef.current !== newCount) {
      bulletsCountRef.current = newCount;
      updateUI();
    }
  }, [updateUI]);

  // 生成普通敌人（血量等于当前子弹等级）
  const spawnEnemy = useCallback(() => {
    if (!gameActiveRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const x = Math.random() * (canvas.width - 40);
    enemiesRef.current.push({
      id: Math.random(),
      x: x,
      y: -40,
      width: 40,
      height: 40,
      hp: bulletsCountRef.current,
      isBoss: false,
    });
  }, []);

  // 生成Boss（20点血）
  const spawnBoss = useCallback(() => {
    if (!gameActiveRef.current) return;
    if (bossesRef.current.length > 0) return; // 已有Boss则不再生成
    const canvas = canvasRef.current;
    if (!canvas) return;
    const x = Math.random() * (canvas.width - 80);
    bossesRef.current.push({
      id: Math.random(),
      x: x,
      y: -80,
      width: 80,
      height: 80,
      hp: 20,
      maxHp: 20,
      isBoss: true,
    });
    console.log("Boss 出现！");
  }, []);

  // 发射子弹
  const shoot = useCallback(() => {
    if (!gameActiveRef.current) return;
    const playerX = playerRef.current.x + playerRef.current.width / 2;
    const playerY = playerRef.current.y;
    const count = bulletsCountRef.current;
    let angles = [];
    if (count <= 3) {
      for (let i = 0; i < count; i++) angles.push(0);
    } else {
      const angleRange = 30;
      const step = (angleRange * 2) / (count - 1);
      for (let i = 0; i < count; i++) {
        angles.push(-angleRange + i * step);
      }
    }
    for (let i = 0; i < count; i++) {
      const rad = angles[i] * Math.PI / 180;
      bulletsRef.current.push({
        x: playerX - 3,
        y: playerY - 10,
        width: 6,
        height: 10,
        vx: Math.sin(rad) * 5,
        vy: -8,
      });
    }
  }, []);

  // 游戏主循环
  const gameLoop = useCallback(() => {
    if (!gameActiveRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000022';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 星星
    ctx.fillStyle = 'white';
    for (let i = 0; i < 100; i++) {
      if (frameRef.current % 100 === i % 100) {
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
      }
    }

    // 玩家移动
    if (keysRef.current.ArrowLeft) playerRef.current.x -= 6;
    if (keysRef.current.ArrowRight) playerRef.current.x += 6;
    playerRef.current.x = Math.max(10, Math.min(canvas.width - playerRef.current.width - 10, playerRef.current.x));

    // 绘制玩家
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(playerRef.current.x, playerRef.current.y, playerRef.current.width, playerRef.current.height);
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(playerRef.current.x + 15, playerRef.current.y - 10, 10, 15);

    // 子弹更新+绘制
    bulletsRef.current = bulletsRef.current.filter(b => {
      b.x += b.vx;
      b.y += b.vy;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(b.x, b.y, b.width, b.height);
      return b.y > -20 && b.x > -20 && b.x < canvas.width + 20;
    });

    // 更新普通敌人
    enemiesRef.current = enemiesRef.current.filter(enemy => {
      enemy.y += 3;
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      ctx.fillStyle = '#000';
      ctx.fillRect(enemy.x + 10, enemy.y + 10, 5, 5);
      ctx.fillRect(enemy.x + 25, enemy.y + 10, 5, 5);
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.fillText(`❤️${enemy.hp}`, enemy.x + 5, enemy.y - 5);
      return enemy.y < canvas.height + 50;
    });

    // 更新Boss
    bossesRef.current = bossesRef.current.filter(boss => {
      boss.y += 2; // 移动稍慢
      // 绘制Boss
      ctx.fillStyle = '#aa44ff';
      ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(boss.x + 20, boss.y + 20, 40, 40);
      // 绘制血量条
      ctx.fillStyle = '#ff0000';
      const hpPercent = boss.hp / boss.maxHp;
      ctx.fillRect(boss.x, boss.y - 10, boss.width * hpPercent, 6);
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.fillText(`BOSS ${boss.hp}/${boss.maxHp}`, boss.x + 5, boss.y - 12);
      return boss.y < canvas.height + 100;
    });

    // 碰撞检测：子弹 vs 普通敌人
    for (let i = 0; i < bulletsRef.current.length; i++) {
      const bullet = bulletsRef.current[i];
      let hit = false;
      // 与普通敌人碰撞
      for (let j = 0; j < enemiesRef.current.length; j++) {
        const enemy = enemiesRef.current[j];
        if (bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y) {
          bulletsRef.current.splice(i, 1);
          enemy.hp--;
          if (enemy.hp <= 0) {
            enemiesRef.current.splice(j, 1);
            scoreRef.current += 10;
            const kills = Math.floor(scoreRef.current / 10);
            killCountRef.current++;
            updateBulletCount(kills);
            // 每击杀5个普通敌人且当前无Boss时，召唤Boss
            if (killCountRef.current >= 5 && bossesRef.current.length === 0) {
              killCountRef.current = 0;
              spawnBoss();
            }
            updateUI();
          }
          hit = true;
          break;
        }
      }
      if (hit) {
        i--;
        continue;
      }
      // 与Boss碰撞
      for (let k = 0; k < bossesRef.current.length; k++) {
        const boss = bossesRef.current[k];
        if (bullet.x < boss.x + boss.width &&
          bullet.x + bullet.width > boss.x &&
          bullet.y < boss.y + boss.height &&
          bullet.y + bullet.height > boss.y) {
          bulletsRef.current.splice(i, 1);
          boss.hp--;
          if (boss.hp <= 0) {
            bossesRef.current.splice(k, 1);
            scoreRef.current += 100; // Boss高分
            const kills = Math.floor(scoreRef.current / 10);
            updateBulletCount(kills);
            updateUI();
          }
          hit = true;
          break;
        }
      }
      if (hit) {
        i--;
      }
    }

    // 玩家与普通敌人碰撞
    for (let enemy of enemiesRef.current) {
      if (playerRef.current.x < enemy.x + enemy.width &&
        playerRef.current.x + playerRef.current.width > enemy.x &&
        playerRef.current.y < enemy.y + enemy.height &&
        playerRef.current.y + playerRef.current.height > enemy.y) {
        setGameActive(false);
        if (window.confirm(`游戏结束！得分：${scoreRef.current}\n是否重新开始？`)) {
          startGame();
        }
        return;
      }
    }
    // 玩家与Boss碰撞
    for (let boss of bossesRef.current) {
      if (playerRef.current.x < boss.x + boss.width &&
        playerRef.current.x + playerRef.current.width > boss.x &&
        playerRef.current.y < boss.y + boss.height &&
        playerRef.current.y + playerRef.current.height > boss.y) {
        setGameActive(false);
        if (window.confirm(`游戏结束！得分：${scoreRef.current}\n是否重新开始？`)) {
          startGame();
        }
        return;
      }
    }

    // UI显示
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`得分: ${scoreRef.current}`, 20, 40);
    ctx.fillText(`子弹数量: ${bulletsCountRef.current}`, 20, 70);
    if (bossesRef.current.length > 0) {
      ctx.fillStyle = 'red';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('⚠️ BOSS 出现 ⚠️', canvas.width - 150, 40);
    }

    frameRef.current++;
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [updateBulletCount, updateUI, spawnBoss]);

  const startGame = useCallback(() => {
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    if (enemyIntervalRef.current) clearInterval(enemyIntervalRef.current);
    if (shootIntervalRef.current) clearInterval(shootIntervalRef.current);

    scoreRef.current = 0;
    bulletsCountRef.current = 1;
    killCountRef.current = 0;
    bulletsRef.current = [];
    enemiesRef.current = [];
    bossesRef.current = [];
    playerRef.current = { x: 400, y: 500, width: 40, height: 40 };
    frameRef.current = 0;
    setGameActive(true);
    gameActiveRef.current = true;
    updateUI();

    enemyIntervalRef.current = setInterval(() => spawnEnemy(), 800);
    shootIntervalRef.current = setInterval(() => shoot(), 150);
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [spawnEnemy, shoot, gameLoop, updateUI]);

  const stopGame = useCallback(() => {
    setGameActive(false);
    gameActiveRef.current = false;
    if (enemyIntervalRef.current) clearInterval(enemyIntervalRef.current);
    if (shootIntervalRef.current) clearInterval(shootIntervalRef.current);
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        keysRef.current[e.key] = true;
      }
    };
    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        keysRef.current[e.key] = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      stopGame();
    };
  }, [stopGame]);

  return (
    <div className="tab-container game-container">
      <h2>星际射手 - 自动射击游戏</h2>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ border: '2px solid #333', borderRadius: '8px', background: '#000022' }}
      />
      <div className="game-controls">
        {!gameActive ? (
          <button onClick={startGame}>开始游戏</button>
        ) : (
          <button onClick={stopGame}>结束游戏</button>
        )}
        <p>左右方向键移动飞机，自动射击。每击落3个敌人增加一条子弹，最多6条。</p>
        <p>子弹数量1-3: 垂直向上；4-6: 扇形散射（60度视角）</p>
        <p>敌人血量等于当前子弹数量。每击败5个普通敌人会召唤一个20血的BOSS！</p>
      </div>
    </div>
  );
};

export default ShootingGame;