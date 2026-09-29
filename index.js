const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const BASE_URL = `https://bot-api.zaloplatforms.com/bot${BOT_TOKEN}`;

const DEV = 'Dev by Duong Quoc Bao';
const START_BALANCE = 100000;
const DAILY_AMOUNT = 100000;
const DAILY_COOLDOWN = 24 * 60 * 60 * 1000;
const MIN_BET = 1000;
const MAX_BET = 50000;

const users = {};
let sessionId = 0;
let history = [];

async function sendMessage(chatId, text) {
  try {
    await axios.post(`${BASE_URL}/sendMessage`, {
      chat_id: chatId,
      text: text
    });
    console.log('Da gui toi ' + chatId);
  } catch (err) {
    console.error('Loi gui:', err.response ? err.response.data : err.message);
  }
}

const DICE_EMOJI = ['1', '2', '3', '4', '5', '6'];

function rollDice() {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1
  ];
}

function playTaiXiu() {
  const dice = rollDice();
  const total = dice[0] + dice[1] + dice[2];
  const result = total >= 11 ? 'Tai' : 'Xiu';
  return { dice: dice, total: total, result: result };
}

function getUser(userId, name) {
  if (!users[userId]) {
    users[userId] = {
      balance: START_BALANCE,
      lastDaily: 0,
      name: name || 'Nguoi choi',
      winCount: 0,
      loseCount: 0,
      totalBet: 0,
      createdAt: Date.now()
    };
    console.log('User moi: ' + name + ' (' + userId + ')');
  }
  return users[userId];
}

function formatMoney(amount) {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' VND';
}

function getHelpText() {
  return '🎰 BOT TAI XIU 🎰\n' +
    '----------------------------\n' +
    '💰 LENH TIEN TE:\n' +
    '• .tx tai 10000 - Cuoc Tai\n' +
    '• .tx xiu 10000 - Cuoc Xiu\n' +
    '• .bal - Xem so du\n' +
    '• .daily - Nhan 100k/24h\n' +
    '• .top - Bang xep hang\n' +
    '• .history - Lich su phien\n' +
    '\n🎮 LENH KHAC:\n' +
    '• .dice - Lac xuc xac\n' +
    '• .coin - Tung dong xu\n' +
    '• .joke - Chuyen cuoi\n' +
    '• .8ball [cau hoi] - Tien tri\n' +
    '• .me - Thong tin ban than\n' +
    '\n----------------------------\n' +
    '🎁 Moi vao: +100.000 VND\n' +
    '🎁 Moi 24h: +100.000 VND\n' +
    '----------------------------\n' +
    DEV;
}

function getBalText(user) {
  return '💰 SO DU\n' +
    '----------------------------\n' +
    '👤 Ten: ' + user.name + '\n' +
    '💵 So du: ' + formatMoney(user.balance) + '\n' +
    '🏆 Thang: ' + user.winCount + ' | 💀 Thua: ' + user.loseCount + '\n' +
    '🎯 Tong cuoc: ' + formatMoney(user.totalBet) + '\n' +
    '----------------------------\n' +
    DEV;
}

function getMeText(user) {
  return '👤 THONG TIN\n' +
    '----------------------------\n' +
    '📛 Ten: ' + user.name + '\n' +
    '💵 So du: ' + formatMoney(user.balance) + '\n' +
    '🏆 Thang: ' + user.winCount + '\n' +
    '💀 Thua: ' + user.loseCount + '\n' +
    '🎯 Tong cuoc: ' + formatMoney(user.totalBet) + '\n' +
    '📅 Tham gia: ' + new Date(user.createdAt).toLocaleString('vi-VN') + '\n' +
    '----------------------------\n' +
    DEV;
}

function getTopText() {
  const keys = Object.keys(users);
  if (keys.length === 0) {
    return '🏆 BANG XEP HANG\n----------------------------\nChua co ai choi!\n----------------------------\n' + DEV;
  }
  const sorted = keys
    .map(function(k) { return { id: k, user: users[k] }; })
    .sort(function(a, b) { return b.user.balance - a.user.balance; })
    .slice(0, 10);

  let text = '🏆 TOP 10 DAI GIA\n----------------------------\n';
  for (let i = 0; i < sorted.length; i++) {
    const u = sorted[i].user;
    const rank = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.';
    text += rank + ' ' + u.name + ': ' + formatMoney(u.balance) + '\n';
  }
  text += '----------------------------\n' + DEV;
  return text;
}

function getHistoryText() {
  if (history.length === 0) {
    return '📜 LICH SU\n----------------------------\nChua co phien nao!\n----------------------------\n' + DEV;
  }
  const recent = history.slice(-10).reverse();
  let text = '📜 10 PHIEN GAN NHAT\n----------------------------\n';
  for (let i = 0; i < recent.length; i++) {
    const h = recent[i];
    const sid = ('00000' + h.id).slice(-5);
    text += '#' + sid + ' | ' + h.dice.join('-') + ' = ' + h.total + ' | ' + h.result + '\n';
  }
  text += '----------------------------\n' + DEV;
  return text;
}

function getDailyText(user) {
  const now = Date.now();
  const elapsed = now - user.lastDaily;

  if (elapsed < DAILY_COOLDOWN) {
    const remaining = DAILY_COOLDOWN - elapsed;
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    return '⏳ CHUA DEN LUOT NHAN\n' +
      '----------------------------\n' +
      '⏰ Con lai: ' + hours + 'h ' + minutes + 'm\n' +
      '----------------------------\n' +
      DEV;
  }

  user.balance += DAILY_AMOUNT;
  user.lastDaily = now;
  return '🎁 NHAN DAILY THANH CONG!\n' +
    '----------------------------\n' +
    '💰 +' + formatMoney(DAILY_AMOUNT) + '\n' +
    '💵 So du moi: ' + formatMoney(user.balance) + '\n' +
    '----------------------------\n' +
    DEV;
}

async function handleBet(chatId, user, choice, amount) {
  const choiceLower = (choice || '').toLowerCase();
  let validChoice = null;

  if (choiceLower === 'tai' || choiceLower === 'tài') validChoice = 'Tai';
  else if (choiceLower === 'xiu' || choiceLower === 'xỉu') validChoice = 'Xiu';

  if (!validChoice) {
    return sendMessage(chatId, '❌ Sai cu phap!\n\nDung: .tx tai 10000\nHoac: .tx xiu 10000\n\n' + DEV);
  }

  if (isNaN(amount) || amount <= 0) {
    return sendMessage(chatId, '❌ So tien khong hop le!\n\nVi du: .tx tai 10000\n\n' + DEV);
  }

  amount = Math.floor(amount);

  if (amount < MIN_BET) {
    return sendMessage(chatId, '❌ Cuoc toi thieu: ' + formatMoney(MIN_BET) + '\n\n' + DEV);
  }

  if (amount > MAX_BET) {
    return sendMessage(chatId, '❌ Cuoc toi da: ' + formatMoney(MAX_BET) + '\n\n' + DEV);
  }

  if (user.balance < amount) {
    return sendMessage(chatId, '❌ Khong du tien!\n\n💵 So du: ' + formatMoney(user.balance) + '\n💸 Can: ' + formatMoney(amount) + '\n\nDung .daily de nhan tien!\n\n' + DEV);
  }

  user.balance -= amount;
  user.totalBet += amount;

  sessionId++;
  const game = playTaiXiu();
  const diceStr = DICE_EMOJI[game.dice[0] - 1] + ' ' + DICE_EMOJI[game.dice[1] - 1] + ' ' + DICE_EMOJI[game.dice[2] - 1];
  const totalStr = game.dice[0] + ' + ' + game.dice[1] + ' + ' + game.dice[2] + ' = ' + game.total;

  history.push({
    id: sessionId,
    dice: game.dice,
    total: game.total,
    result: game.result,
    choice: validChoice,
    amount: amount,
    userId: user.name,
    time: Date.now()
  });
  if (history.length > 100) history.shift();

  const sid = ('00000' + sessionId).slice(-5);
  const sessionStr = '#' + sid;
  const isWin = validChoice === game.result;

  if (isWin) {
    const winAmount = amount * 2;
    user.balance += winAmount;
    user.winCount++;

    return sendMessage(chatId, '🎰 PHIEN ' + sessionStr + '\n' +
      '----------------------------\n' +
      '🎲 Xuc xac: ' + diceStr + '\n' +
      '📊 Tong: ' + totalStr + '\n' +
      '🎯 Ket qua: ' + (game.result === 'Tai' ? '🔴 TAI' : '🔵 XIU') + '\n' +
      '----------------------------\n' +
      '🎉 BAN THANG!\n' +
      '✅ Cuoc: ' + validChoice + ' - ' + formatMoney(amount) + '\n' +
      '💰 Nhan: +' + formatMoney(winAmount) + '\n' +
      '💵 So du: ' + formatMoney(user.balance) + '\n' +
      '----------------------------\n' +
      DEV);
  } else {
    user.loseCount++;
    return sendMessage(chatId, '🎰 PHIEN ' + sessionStr + '\n' +
      '----------------------------\n' +
      '🎲 Xuc xac: ' + diceStr + '\n' +
      '📊 Tong: ' + totalStr + '\n' +
      '🎯 Ket qua: ' + (game.result === 'Tai' ? '🔴 TAI' : '🔵 XIU') + '\n' +
      '----------------------------\n' +
      '😢 BAN THUA!\n' +
      '❌ Cuoc: ' + validChoice + ' - ' + formatMoney(amount) + '\n' +
      '💸 Mat: -' + formatMoney(amount) + '\n' +
      '💵 So du: ' + formatMoney(user.balance) + '\n' +
      '----------------------------\n' +
      DEV);
  }
}

function extractCommand(text) {
  const lower = text.toLowerCase().trim();
  const match = lower.match(/\.([a-z0-9]+)/);
  if (!match) return null;
  return '.' + match[1];
}

async function handleMessage(update) {
  console.log('Nhan update:', JSON.stringify(update, null, 2));

  const message = update.message || update;
  if (!message) return;

  const chatId = message.chat && message.chat.id ? message.chat.id : message.chat_id;
  const chatType = message.chat && message.chat.chat_type ? message.chat.chat_type : 'PRIVATE';
  const senderId = message.from && message.from.id ? message.from.id : (message.from_id || 'unknown');
  const senderName = message.from && message.from.display_name ? message.from.display_name : 'Nguoi choi';

  const text = (message.text || '').trim();

  if (!chatId || !text) return;

  const user = getUser(senderId, senderName);

  console.log('chatId: ' + chatId + ' | type: ' + chatType + ' | user: ' + senderName + ' | text: ' + text);

  const cmd = extractCommand(text);
  if (!cmd) return;

  console.log('Command: ' + cmd);

  if (cmd === '.help') {
    return sendMessage(chatId, getHelpText());
  }

  if (cmd === '.bal' || cmd === '.balance' || cmd === '.money') {
    return sendMessage(chatId, getBalText(user));
  }

  if (cmd === '.me' || cmd === '.info') {
    return sendMessage(chatId, getMeText(user));
  }

  if (cmd === '.daily' || cmd === '.diemdanh') {
    return sendMessage(chatId, getDailyText(user));
  }

  if (cmd === '.top' || cmd === '.bxh') {
    return sendMessage(chatId, getTopText());
  }

  if (cmd === '.history' || cmd === '.ls') {
    return sendMessage(chatId, getHistoryText());
  }

  if (cmd === '.tx') {
    const cleaned = text.replace(/@\S+/g, '').trim();
    const parts = cleaned.split(/\s+/);
    if (parts.length < 3) {
      return sendMessage(chatId, '❌ Cu phap: .tx [tai/xiu] [so tien]\n\nVi du: .tx tai 10000\n\n' + DEV);
    }
    const choice = parts[1];
    const amount = parseInt(parts[2].replace(/[.,]/g, ''), 10);
    return handleBet(chatId, user, choice, amount);
  }

  if (cmd === '.dice') {
    const n = Math.floor(Math.random() * 6) + 1;
    return sendMessage(chatId, '🎲 Ban lac duoc: ' + n + '\n\n' + DEV);
  }

  if (cmd === '.coin') {
    const result = Math.random() < 0.5 ? 'Sap' : 'Ngua';
    return sendMessage(chatId, '🪙 Ket qua: ' + result + '\n\n' + DEV);
  }

  if (cmd === '.joke') {
    const jokes = [
      'Vi sao lap trinh vien thich toi? Vi khong co bug nao trong bong toi! 😂',
      'Co 10 loai nguoi: loai hieu binary va loai khong hieu 🤖',
      'Tai sao con ga di qua duong? De sang ben kia duong 🐔'
    ];
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    return sendMessage(chatId, '😂 ' + joke + '\n\n' + DEV);
  }

  if (cmd === '.8ball' || cmd === '.boid') {
    const answers = [
      '🎱 Chac chan roi!',
      '🎱 Khong dau ban oi!',
      '🎱 Co the...',
      '🎱 Dung mo!',
      '🎱 Hoi lai sau nhe!',
      '🎱 50/50 thoi!',
      '🎱 Tin vao ban than di!',
      '🎱 Cau tra loi la CO!'
    ];
    const answer = answers[Math.floor(Math.random() * answers.length)];
    return sendMessage(chatId, answer + '\n\n' + DEV);
  }

  if (cmd === '.start') {
    return sendMessage(chatId, getHelpText());
  }

  return sendMessage(chatId, '❓ Lenh khong hop le!\n\nGo .help de xem danh sach lenh\n\n' + DEV);
}

app.post('/webhook', async function(req, res) {
  res.json({ ok: true });
  try {
    await handleMessage(req.body);
  } catch (err) {
    console.error('Loi:', err);
  }
});

app.get('/', function(req, res) {
  res.send('Bot Tai Xiu OK! | ' + DEV);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
  console.log('Bot chay port ' + PORT);
  console.log(DEV);
});
