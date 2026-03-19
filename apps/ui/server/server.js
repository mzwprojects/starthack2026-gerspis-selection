const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const questions = require('./data/questions');
const tips = require('./data/tips');
const assets = require('./data/assets');
const { runSimulation } = require('./simulation');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// In-memory stores
const users = {};
let nextUserId = 1;
const lobbies = {};

// ─── AUTH ────────────────────────────────────────────────────────────

app.post('/api/register', (req, res) => {
  const { email, password, displayName } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  if (users[email]) {
    return res.status(409).json({ error: 'User already exists' });
  }
  users[email] = {
    id: nextUserId++,
    email,
    password,
    displayName: displayName || email.split('@')[0],
    coins: 0,
    quizHistory: [],
    gamesPlayed: 0
  };
  res.json({ success: true, user: { id: users[email].id, email, displayName: users[email].displayName, coins: 0 } });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const user = users[email];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({ success: true, user: { id: user.id, email, displayName: user.displayName, coins: user.coins } });
});

// ─── QUIZ ────────────────────────────────────────────────────────────

app.get('/api/quiz', (req, res) => {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 4).map(q => ({
    id: q.id, question: q.question, options: q.options
  }));
  res.json({ questions: selected });
});

app.post('/api/quiz/answer', (req, res) => {
  const { questionId, answerIndex, email } = req.body;
  const question = questions.find(q => q.id === questionId);
  if (!question) return res.status(404).json({ error: 'Question not found' });
  const correct = question.correct === answerIndex;
  const coinsEarned = correct ? 10 : 0;
  if (email && users[email]) users[email].coins += coinsEarned;
  res.json({
    correct, correctAnswer: question.correct,
    explanation: question.explanation, coinsEarned,
    totalCoins: email && users[email] ? users[email].coins : 0
  });
});

// ─── TIPS ────────────────────────────────────────────────────────────

app.get('/api/tips', (req, res) => {
  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  res.json({ tip: randomTip });
});

// ─── ASSETS ──────────────────────────────────────────────────────────

app.get('/api/assets', (req, res) => {
  res.json({
    assets: assets.map(a => ({
      id: a.id, name: a.name, fullName: a.fullName, category: a.category,
      icon: a.icon, description: a.description,
      infoText: a.infoText || a.description,
      riskLevel: a.volatility > 0.5 ? 'Very High' : a.volatility > 0.2 ? 'High' : a.volatility > 0.1 ? 'Medium' : 'Low'
    }))
  });
});

// ─── SIMULATION (Sandbox) ────────────────────────────────────────────

app.post('/api/simulate', (req, res) => {
  const { years, totalBudget, allocation, email } = req.body;
  if (!years || !totalBudget || !allocation) {
    return res.status(400).json({ error: 'years, totalBudget, and allocation required' });
  }
  const result = runSimulation({ years, totalBudget, allocation });
  if (result.error) return res.status(400).json({ error: result.error });
  if (email && users[email]) users[email].gamesPlayed++;
  res.json(result);
});

// ─── USER DATA ───────────────────────────────────────────────────────

app.get('/api/user/:email', (req, res) => {
  const user = users[req.params.email];
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, email: user.email, displayName: user.displayName, coins: user.coins, gamesPlayed: user.gamesPlayed });
});

// ═══════════════════════════════════════════════════════════════════════
// ─── SOCKET.IO MULTIPLAYER ───────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

function generateRoomCode() {
  let code;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
  } while (lobbies[code]);
  return code;
}

io.on('connection', (socket) => {
  console.log(`🔌 Player connected: ${socket.id}`);

  // ── CREATE LOBBY ──
  socket.on('create_lobby', ({ displayName, email }) => {
    const roomCode = generateRoomCode();
    const player = { id: socket.id, displayName, email, isHost: true, ready: false, allocation: null };
    lobbies[roomCode] = {
      code: roomCode,
      host: socket.id,
      players: [player],
      state: 'waiting', // waiting | setup | simulating | finished
      settings: { years: 10, totalBudget: 10000 },
      simResults: {},
    };
    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.emit('lobby_created', { roomCode });
    io.to(roomCode).emit('lobby_update', getLobbyInfo(roomCode));
    console.log(`🏠 Lobby ${roomCode} created by ${displayName}`);
  });

  // ── JOIN LOBBY ──
  socket.on('join_lobby', ({ roomCode, displayName, email }) => {
    const lobby = lobbies[roomCode];
    if (!lobby) return socket.emit('error_msg', { message: 'Lobby not found' });
    if (lobby.state !== 'waiting') return socket.emit('error_msg', { message: 'Game already started' });
    if (lobby.players.length >= 6) return socket.emit('error_msg', { message: 'Lobby is full (max 6)' });

    const player = { id: socket.id, displayName, email, isHost: false, ready: false, allocation: null };
    lobby.players.push(player);
    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.emit('lobby_joined', { roomCode });
    io.to(roomCode).emit('lobby_update', getLobbyInfo(roomCode));
    console.log(`👋 ${displayName} joined lobby ${roomCode}`);
  });

  // ── HOST STARTS GAME (setup phase) ──
  socket.on('host_start_game', ({ years, totalBudget }) => {
    const lobby = lobbies[socket.roomCode];
    if (!lobby || lobby.host !== socket.id) return;
    if (lobby.players.length < 1) return socket.emit('error_msg', { message: 'Need at least 1 player' });

    lobby.state = 'setup';
    lobby.settings = { years: years || 10, totalBudget: totalBudget || 10000 };
    lobby.players.forEach(p => { p.ready = false; p.allocation = null; });
    io.to(socket.roomCode).emit('game_started', { years: lobby.settings.years, totalBudget: lobby.settings.totalBudget });
    console.log(`🎮 Game started in lobby ${socket.roomCode}`);
  });

  // ── PLAYER SUBMITS ALLOCATION ──
  socket.on('submit_allocation', ({ allocation }) => {
    const lobby = lobbies[socket.roomCode];
    if (!lobby || lobby.state !== 'setup') return;

    const player = lobby.players.find(p => p.id === socket.id);
    if (!player) return;
    player.allocation = allocation;
    player.ready = true;
    console.log(`📝 ${player.displayName} submitted allocation in lobby ${socket.roomCode}`);

    io.to(socket.roomCode).emit('lobby_update', getLobbyInfo(socket.roomCode));

    // Check if all players are ready
    const allReady = lobby.players.every(p => p.ready);
    if (allReady) {
      console.log(`✅ All players ready in lobby ${socket.roomCode}! Emitting all_ready...`);
      io.to(socket.roomCode).emit('all_ready');
    }
  });

  // ── HOST STARTS SIMULATION ──
  socket.on('start_simulation', () => {
    try {
      const lobby = lobbies[socket.roomCode];
      if (!lobby || lobby.host !== socket.id) return;
      if (!lobby.players.every(p => p.ready)) return;

      lobby.state = 'simulating';
      console.log(`🚀 Host starting simulation for lobby ${socket.roomCode}`);

      // Run simulation for each player with the SAME market events (same seed)
      const { years, totalBudget } = lobby.settings;
      const results = {};

      lobby.players.forEach(player => {
        const result = runSimulation({ years, totalBudget, allocation: player.allocation });
        if (result.error) throw new Error(result.error);
        results[player.id] = {
          displayName: player.displayName,
          portfolioHistory: result.portfolioHistory,
          summary: result.summary,
          yearlyData: result.yearlyData,
          saverHistory: result.saverHistory,
          traderHistory: result.traderHistory,
          assetHistories: result.assetHistories,
        };
      });

      lobby.simResults = results;

      // Build combined data: for each year, include all players' values
      const yearByYear = [];
      for (let y = 0; y <= years; y++) {
        const yearData = {};
        lobby.players.forEach(p => {
          yearData[p.id] = {
            displayName: p.displayName,
            value: results[p.id].portfolioHistory[y],
          };
        });
        yearByYear.push(yearData);
      }

      // Get interactive events from first player's sim for all players to share
      const sharedYearlyData = results[lobby.players[0].id].yearlyData;

      io.to(socket.roomCode).emit('simulation_data', {
        years,
        totalBudget,
        yearByYear,
        saverHistory: results[lobby.players[0].id].saverHistory,
        traderHistory: results[lobby.players[0].id].traderHistory,
        yearlyData: sharedYearlyData,
        playerResults: results,
        players: lobby.players.map(p => ({ id: p.id, displayName: p.displayName })),
      });
      console.log(`📊 Simulation running for lobby ${socket.roomCode} with ${lobby.players.length} players`);
    } catch (err) {
      console.error('Simulation Error:', err);
      io.to(socket.roomCode).emit('error_msg', { message: 'Simulation failed: ' + err.message });
    }
  });

  // ── PLAYER REQUESTS RESULTS ──
  socket.on('get_results', () => {
    const lobby = lobbies[socket.roomCode];
    if (!lobby) return;

    const rankings = lobby.players
      .map(p => ({
        id: p.id,
        displayName: p.displayName,
        finalValue: lobby.simResults[p.id]?.summary?.finalValue || 0,
        totalReturnPct: lobby.simResults[p.id]?.summary?.totalReturnPct || 0,
        sharpeRatio: lobby.simResults[p.id]?.summary?.sharpeRatio || 0,
        portfolioHistory: lobby.simResults[p.id]?.portfolioHistory || [],
      }))
      .sort((a, b) => b.finalValue - a.finalValue);

    socket.emit('results_data', {
      rankings,
      years: lobby.settings.years,
      totalBudget: lobby.settings.totalBudget,
      saverHistory: lobby.simResults[lobby.players[0].id]?.saverHistory || [],
    });
  });

  // ── DISCONNECT ──
  socket.on('disconnect', () => {
    const roomCode = socket.roomCode;
    if (!roomCode || !lobbies[roomCode]) return;

    const lobby = lobbies[roomCode];
    lobby.players = lobby.players.filter(p => p.id !== socket.id);
    console.log(`❌ Player disconnected from lobby ${roomCode}`);

    if (lobby.players.length === 0) {
      delete lobbies[roomCode];
      console.log(`🗑️ Lobby ${roomCode} deleted (empty)`);
    } else {
      // If host left, assign new host
      if (lobby.host === socket.id) {
        lobby.host = lobby.players[0].id;
        lobby.players[0].isHost = true;
      }
      io.to(roomCode).emit('lobby_update', getLobbyInfo(roomCode));
      io.to(roomCode).emit('player_left', { message: 'A player has left the lobby' });
    }
  });
});

function getLobbyInfo(roomCode) {
  const lobby = lobbies[roomCode];
  if (!lobby) return null;
  return {
    code: lobby.code,
    state: lobby.state,
    settings: lobby.settings,
    players: lobby.players.map(p => ({
      id: p.id,
      displayName: p.displayName,
      isHost: p.isHost,
      ready: p.ready,
    })),
  };
}

// ─── START ───────────────────────────────────────────────────────────

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎮 Wealth Manager Arena API running on port ${PORT}`);
  console.log(`   http://localhost:${PORT}/api/assets`);
  console.log(`   ⚡ Socket.IO multiplayer enabled\n`);
});
