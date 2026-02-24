// ============================================================
// CATCH THE FALLING PAYPAL STOCK - Arcade Game
// Alex Chriss drops $$ bags, you catch them before they crash
// ============================================================

const GAME = (() => {
  let canvas, ctx;
  let score = 0, lives = 3, level = 1, gameOver = false, started = false;
  let animId;
  let bags = [], explosions = [];
  let player = { x: 0, y: 0, w: 80, h: 40, speed: 7 };
  let keys = {};
  let highScore = parseInt(localStorage.getItem('paypal_hs') || '0');
  let frameCount = 0;
  let stockPrice = 310;
  let spawnRate = 120;

  const COLORS = {
    bg: '#0a0a0a',
    player: '#1a6b1a',
    playerText: '#00ff00',
    bag: '#cc9900',
    bagText: '#fff',
    crash: '#cc0000',
    ui: '#ff4444',
    sky: '#0d0d2b',
    ground: '#1a0000',
  };

  function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', e => { keys[e.key] = true; e.preventDefault(); });
    window.addEventListener('keyup', e => { keys[e.key] = false; });
    // Touch support
    canvas.addEventListener('touchstart', handleTouch, {passive:false});
    canvas.addEventListener('touchmove', handleTouch, {passive:false});
    drawStart();
  }

  function resizeCanvas() {
    canvas.width = Math.min(800, window.innerWidth - 40);
    canvas.height = 480;
    player.y = canvas.height - 70;
    if (!started) drawStart();
  }

  function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const tx = touch.clientX - rect.left;
    player.x = tx - player.w / 2;
  }

  function drawStart() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('💸 CATCH THE DIVIDENDS 💸', canvas.width/2, 140);

    ctx.fillStyle = '#888';
    ctx.font = '16px monospace';
    ctx.fillText('אלכס כריס מפיל את הכסף של המשקיעים', canvas.width/2, 185);
    ctx.fillText('תפוס את השקיות לפני שייפלו לרצפה!', canvas.width/2, 210);

    ctx.fillStyle = '#cc9900';
    ctx.font = '14px monospace';
    ctx.fillText('← → לנוע  |  נגע/מובייל: גרור', canvas.width/2, 250);

    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('[ לחץ SPACE או לחץ על המסך להתחיל ]', canvas.width/2, 310);

    ctx.fillStyle = '#444';
    ctx.font = '13px monospace';
    ctx.fillText(`Best: $${highScore}`, canvas.width/2, 360);

    canvas.onclick = startGame;
    document.onkeydown = e => { if(e.code === 'Space') { e.preventDefault(); startGame(); } };
  }

  function startGame() {
    canvas.onclick = null;
    document.onkeydown = null;
    score = 0; lives = 3; level = 1; gameOver = false; started = true;
    bags = []; explosions = [];
    stockPrice = 310;
    spawnRate = 100;
    frameCount = 0;
    player.x = canvas.width / 2 - player.w / 2;
    window.addEventListener('keydown', e => { keys[e.key] = true; });
    window.addEventListener('keyup', e => { keys[e.key] = false; });
    if (animId) cancelAnimationFrame(animId);
    loop();
  }

  function spawnBag() {
    const isBad = Math.random() < 0.2; // 20% chance of "CHRISS" bag (lose life)
    bags.push({
      x: Math.random() * (canvas.width - 40) + 10,
      y: -30,
      w: 44, h: 44,
      speed: 2 + level * 0.4 + Math.random() * 2,
      bad: isBad,
      wobble: Math.random() * Math.PI * 2,
      value: isBad ? 0 : (10 * level),
    });
  }

  function addExplosion(x, y, color, text) {
    explosions.push({ x, y, color, text, life: 50, maxLife: 50 });
  }

  function loop() {
    frameCount++;

    // Spawn
    const sr = Math.max(30, spawnRate - level * 8);
    if (frameCount % sr === 0) spawnBag();

    // Level up every 200 points
    level = Math.floor(score / 200) + 1;
    stockPrice = Math.max(44, 310 - score * 0.8);

    // Player movement
    if (!gameOver) {
      if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed + level;
      if (keys['ArrowRight'] || keys['d']) player.x += player.speed + level;
      player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
    }

    // Update bags
    for (let i = bags.length - 1; i >= 0; i--) {
      const b = bags[i];
      b.y += b.speed;
      b.wobble += 0.05;

      // Collision with player
      if (
        b.y + b.h > player.y &&
        b.y < player.y + player.h &&
        b.x + b.w > player.x &&
        b.x < player.x + player.w
      ) {
        bags.splice(i, 1);
        if (b.bad) {
          lives--;
          addExplosion(b.x, b.y, '#ff0000', '💀 CHRISS!');
          if (lives <= 0) { endGame(); return; }
        } else {
          score += b.value;
          if (score > highScore) { highScore = score; localStorage.setItem('paypal_hs', highScore); }
          addExplosion(b.x, b.y, '#00ff00', `+$${b.value}`);
        }
        continue;
      }

      // Fell off screen
      if (b.y > canvas.height) {
        bags.splice(i, 1);
        if (!b.bad) {
          lives--;
          addExplosion(b.x, canvas.height - 20, '#ff6600', '-1 ❤️');
          if (lives <= 0) { endGame(); return; }
        }
      }
    }

    // Update explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
      explosions[i].life--;
      if (explosions[i].life <= 0) explosions.splice(i, 1);
    }

    draw();
    animId = requestAnimationFrame(loop);
  }

  function draw() {
    const W = canvas.width, H = canvas.height;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#050510');
    grad.addColorStop(1, '#1a0000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (let i = 0; i < 30; i++) {
      const sx = (i * 137 + frameCount * 0.1) % W;
      const sy = (i * 97) % (H * 0.6);
      ctx.fillRect(sx, sy, 1, 1);
    }

    // Ground
    ctx.fillStyle = '#1a0000';
    ctx.fillRect(0, H - 30, W, 30);
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(0, H - 31, W, 2);

    // Stock price ticker
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, W, 36);
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`PYPL: $${Math.floor(stockPrice)}`, 10, 23);
    ctx.fillStyle = '#cc0000';
    ctx.fillText(`▼ ${(310 - stockPrice).toFixed(0)}`, 110, 23);
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText(`LEVEL ${level}`, W/2, 23);
    ctx.fillStyle = '#00cc00';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: $${score}  |  BEST: $${highScore}`, W - 10, 23);

    // Lives
    ctx.textAlign = 'left';
    ctx.font = '18px monospace';
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < lives ? '#ff4444' : '#333';
      ctx.fillText('❤', 10 + i * 28, 60);
    }
    ctx.fillStyle = '#666';
    ctx.font = '11px monospace';
    ctx.fillText('Alex Chriss watching...', W - 170, 60);

    // Bags
    bags.forEach(b => {
      const bx = b.x + Math.sin(b.wobble) * 3;
      ctx.save();
      // Bag shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(bx + b.w/2, b.y + b.h + 4, b.w/2, 6, 0, 0, Math.PI*2);
      ctx.fill();

      if (b.bad) {
        // Bad bag - Alex's face 💀
        ctx.font = '36px serif';
        ctx.fillText('🤵', bx, b.y + b.h - 4);
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CHRISS', bx + b.w/2, b.y + b.h + 14);
      } else {
        // Money bag
        ctx.font = '36px serif';
        ctx.fillText('💰', bx, b.y + b.h - 4);
        ctx.fillStyle = '#ffdd00';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`$${b.value}`, bx + b.w/2, b.y + b.h + 14);
      }
      ctx.restore();
    });

    // Player (portfolio manager / investor)
    ctx.save();
    ctx.fillStyle = '#1a4a1a';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x, player.y, player.w, player.h);
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('📊 INVESTOR', player.x + player.w/2, player.y + 15);
    ctx.fillStyle = '#888';
    ctx.font = '9px monospace';
    ctx.fillText('(not Alex)', player.x + player.w/2, player.y + 28);
    ctx.restore();

    // Explosions
    explosions.forEach(e => {
      const alpha = e.life / e.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = e.color;
      ctx.font = `bold ${14 + (1 - alpha) * 10}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(e.text, e.x + 22, e.y - (1 - alpha) * 40);
      ctx.restore();
    });

    ctx.textAlign = 'left';
  }

  function endGame() {
    gameOver = true;
    cancelAnimationFrame(animId);

    // Draw game over
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('GAME OVER', canvas.width/2, 150);

    ctx.fillStyle = '#cc9900';
    ctx.font = '20px monospace';
    ctx.fillText(`הצלת: $${score}`, canvas.width/2, 210);

    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.fillText(`השאר? אלכס כריס הפיל אותם`, canvas.width/2, 250);

    if (score >= highScore) {
      ctx.fillStyle = '#ffdd00';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('🏆 שיא חדש!', canvas.width/2, 290);
    } else {
      ctx.fillStyle = '#555';
      ctx.font = '14px monospace';
      ctx.fillText(`שיא: $${highScore}`, canvas.width/2, 290);
    }

    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('[ SPACE או לחץ לשחק שוב ]', canvas.width/2, 350);

    canvas.onclick = startGame;
    document.onkeydown = e => { if(e.code === 'Space') { e.preventDefault(); startGame(); } };
  }

  return { init };
})();

window.addEventListener('DOMContentLoaded', GAME.init);
