const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const BASE_URL = `https://bot-api.zaloplatforms.com/bot${BOT_TOKEN}`;

const DEV = 'Dev by Dương Quốc Bảo';
const START_BALANCE = 100000;
const DAILY_AMOUNT = 100000;
const DAILY_COOLDOWN = 24 * 60 * 60 * 1000;
const MIN_BET = 1000;
const MAX_BET = 50000;

const users = {};
let sessionId = 0;
let history = [];

// ====== ẢNH XÚC XẮC ĐEN TRẮNG (WIKIMEDIA) ======
const DICE_IMAGES = {
  1: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Dice-1-b.svg',
  2: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Dice-2-b.svg',
  3: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Dice-3-b.svg',
  4: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Dice-4-b.svg',
  5: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Dice-5-b.svg',
  6: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Dice-6-b.svg'
};
// ====== EMOJI XÚC XẮC ======
const DICE_EMOJI = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

// ====== GỬI TIN NHẮN ======
async function sendMessage(chatId, text) {
  try {
    await axios.post(`${BASE_URL}/sendMessage`, {
      chat_id: chatId,
      text: text
    });
    console.log('Đã gửi tin tới ' + chatId);
  } catch (err) {
    console.error('Lỗi gửi tin:', err.response ? err.response.data : err.message);
  }
}

// ====== GỬI ẢNH ======
async function sendPhoto(chatId, photoUrl, caption) {
  try {
    await axios.post(`${BASE_URL}/sendPhoto`, {
      chat_id: chatId,
      photo: photoUrl,
      caption: caption || ''
    });
    console.log('Đã gửi ảnh tới ' + chatId);
  } catch (err) {
    console.error('Lỗi gửi ảnh:', err.response ? err.response.data : err.message);
  }
}

// ====== XÚC XẮC ======
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
  const result = total >= 11 ? 'Tài' : 'Xỉu';
  return { dice: dice, total: total, result: result };
}

// ====== USER ======
function getUser(userId, name) {
  if (!users[userId]) {
    users[userId] = {
      balance: START_BALANCE,
      lastDaily: 0,
      name: name || 'Người chơi',
      winCount: 0,
      loseCount: 0,
      totalBet: 0,
      createdAt: Date.now()
    };
    console.log('User mới: ' + name + ' (' + userId + ')');
  }
  return users[userId];
}

function formatMoney(amount) {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' VND';
}

function getHelpText() {
  return '🎰 BOT TÀI XỈU 🎰\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    '💰 LỆNH TIỀN TỆ:\n' +
    '• .tx tài 10000 - Cược Tài\n' +
    '• .tx xỉu 10000 - Cược Xỉu\n' +
    '• .bal - Xem số dư\n' +
    '• .daily - Nhận 100k/24h\n' +
    '• .top - Bảng xếp hạng\n' +
    '• .history - Lịch sử phiên\n' +
    '\n🎮 LỆNH KHÁC:\n' +
    '• .dice - Lắc xúc xắc\n' +
    '• .coin - Tung đồng xu\n' +
    '• .joke - Chuyện cười\n' +
    '• .8ball [câu hỏi] - Tiên tri\n' +
    '• .me - Thông tin bản thân\n' +
    '\n━━━━━━━━━━━━━━━━━━\n' +
    '🎁 Mới vào: +100.000 VND\n' +
    '🎁 Mỗi 24h: +100.000 VND\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    DEV;
}

function getBalText(user) {
  return '💰 SỐ DƯ\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    '👤 Tên: ' + user.name + '\n' +
    '💵 Số dư: ' + formatMoney(user.balance) + '\n' +
    '🏆 Thắng: ' + user.winCount + ' | 💀 Thua: ' + user.loseCount + '\n' +
    '🎯 Tổng cược: ' + formatMoney(user.totalBet) + '\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    DEV;
}

function getMeText(user) {
  return '👤 THÔNG TIN\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    '📛 Tên: ' + user.name + '\n' +
    '💵 Số dư: ' + formatMoney(user.balance) + '\n' +
    '🏆 Thắng: ' + user.winCount + '\n' +
    '💀 Thua: ' + user.loseCount + '\n' +
    '🎯 Tổng cược: ' + formatMoney(user.totalBet) + '\n' +
    '📅 Tham gia: ' + new Date(user.createdAt).toLocaleString('vi-VN') + '\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    DEV;
}

function getTopText() {
  const keys = Object.keys(users);
  if (keys.length === 0) {
    return '🏆 BẢNG XẾP HẠNG\n━━━━━━━━━━━━━━━━━━\nChưa có ai chơi!\n━━━━━━━━━━━━━━━━━━\n' + DEV;
  }
  const sorted = keys
    .map(function(k) { return { id: k, user: users[k] }; })
    .sort(function(a, b) { return b.user.balance - a.user.balance; })
    .slice(0, 10);

  let text = '🏆 TOP 10 ĐẠI GIA\n━━━━━━━━━━━━━━━━━━\n';
  for (let i = 0; i < sorted.length; i++) {
    const u = sorted[i].user;
    const rank = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.';
    text += rank + ' ' + u.name + ': ' + formatMoney(u.balance) + '\n';
  }
  text += '━━━━━━━━━━━━━━━━━━\n' + DEV;
  return text;
}

function getHistoryText() {
  if (history.length === 0) {
    return '📜 LỊCH SỬ\n━━━━━━━━━━━━━━━━━━\nChưa có phiên nào!\n━━━━━━━━━━━━━━━━━━\n' + DEV;
  }
  const recent = history.slice(-10).reverse();
  let text = '📜 10 PHIÊN GẦN NHẤT\n━━━━━━━━━━━━━━━━━━\n';
  for (let i = 0; i < recent.length; i++) {
    const h = recent[i];
    const sid = ('00000' + h.id).slice(-5);
    text += '#' + sid + ' | ' + h.dice.join('-') + ' = ' + h.total + ' | ' + h.result + '\n';
  }
  text += '━━━━━━━━━━━━━━━━━━\n' + DEV;
  return text;
}

function getDailyText(user) {
  const now = Date.now();
  const elapsed = now - user.lastDaily;

  if (elapsed < DAILY_COOLDOWN) {
    const remaining = DAILY_COOLDOWN - elapsed;
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    return '⏳ CHƯA ĐẾN LƯỢT NHẬN\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      '⏰ Còn lại: ' + hours + 'h ' + minutes + 'm\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      DEV;
  }

  user.balance += DAILY_AMOUNT;
  user.lastDaily = now;
  return '🎁 NHẬN DAILY THÀNH CÔNG!\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    '💰 +' + formatMoney(DAILY_AMOUNT) + '\n' +
    '💵 Số dư mới: ' + formatMoney(user.balance) + '\n' +
    '━━━━━━━━━━━━━━━━━━\n' +
    DEV;
}

// ====== XỬ LÝ CƯỢC ======
async function handleBet(chatId, user, choice, amount) {
  const choiceLower = (choice || '').toLowerCase();
  let validChoice = null;

  if (choiceLower === 'tai' || choiceLower === 'tài') validChoice = 'Tài';
  else if (choiceLower === 'xiu' || choiceLower === 'xỉu') validChoice = 'Xỉu';

  if (!validChoice) {
    return sendMessage(chatId, '❌ Sai cú pháp!\n\nDùng: .tx tài 10000\nHoặc: .tx xỉu 10000\n\n' + DEV);
  }

  if (isNaN(amount) || amount <= 0) {
    return sendMessage(chatId, '❌ Số tiền không hợp lệ!\n\nVí dụ: .tx tài 10000\n\n' + DEV);
  }

  amount = Math.floor(amount);

  if (amount < MIN_BET) {
    return sendMessage(chatId, '❌ Cược tối thiểu: ' + formatMoney(MIN_BET) + '\n\n' + DEV);
  }

  if (amount > MAX_BET) {
    return sendMessage(chatId, '❌ Cược tối đa: ' + formatMoney(MAX_BET) + '\n\n' + DEV);
  }

  if (user.balance < amount) {
    return sendMessage(chatId, '❌ Không đủ tiền!\n\n💵 Số dư: ' + formatMoney(user.balance) + '\n💸 Cần: ' + formatMoney(amount) + '\n\nDùng .daily để nhận tiền!\n\n' + DEV);
  }

  user.balance -= amount;
  user.totalBet += amount;

  sessionId++;
  const game = playTaiXiu();
  const diceStr = DICE_EMOJI[game.dice[0] - 1] + ' ' + DICE_EMOJI[game.dice[1] - 1] + ' ' + DICE_EMOJI[game.dice[2] - 1];
  const totalStr = 'Tổng = ' + game.total;

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

  // ===== GỬI 3 ẢNH XÚC XẮC =====
  await sendPhoto(chatId, DICE_IMAGES[game.dice[0]], '🎲 Xúc xắc 1: ' + game.dice[0]);
  await sendPhoto(chatId, DICE_IMAGES[game.dice[1]], '🎲 Xúc xắc 2: ' + game.dice[1]);
  await sendPhoto(chatId, DICE_IMAGES[game.dice[2]], '🎲 Xúc xắc 3: ' + game.dice[2]);

  if (isWin) {
    const winAmount = amount * 2;
    user.balance += winAmount;
    user.winCount++;

    return sendMessage(chatId, '🎰 PHIÊN ' + sessionStr + '\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      '🎲 Xúc xắc: ' + diceStr + '\n' +
      '📊 ' + totalStr + '\n' +
      '🎯 Kết quả: ' + (game.result === 'Tài' ? '🔴 TÀI' : '🔵 XỈU') + '\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      '🎉 BẠN THẮNG!\n' +
      '✅ Cược: ' + validChoice + ' - ' + formatMoney(amount) + '\n' +
      '💰 Nhận: +' + formatMoney(winAmount) + '\n' +
      '💵 Số dư: ' + formatMoney(user.balance) + '\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      DEV);
  } else {
    user.loseCount++;
    return sendMessage(chatId, '🎰 PHIÊN ' + sessionStr + '\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      '🎲 Xúc xắc: ' + diceStr + '\n' +
      '📊 ' + totalStr + '\n' +
      '🎯 Kết quả: ' + (game.result === 'Tài' ? '🔴 TÀI' : '🔵 XỈU') + '\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      '😢 BẠN THUA!\n' +
      '❌ Cược: ' + validChoice + ' - ' + formatMoney(amount) + '\n' +
      '💸 Mất: -' + formatMoney(amount) + '\n' +
      '💵 Số dư: ' + formatMoney(user.balance) + '\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
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
  console.log('Nhận update:', JSON.stringify(update, null, 2));

  const message = update.message || update;
  if (!message) return;

  const chatId = message.chat && message.chat.id ? message.chat.id : message.chat_id;
  const chatType = message.chat && message.chat.chat_type ? message.chat.chat_type : 'PRIVATE';
  const senderId = message.from && message.from.id ? message.from.id : (message.from_id || 'unknown');
  const senderName = message.from && message.from.display_name ? message.from.display_name : 'Người chơi';

  const text = (message.text || '').trim();

  if (!chatId || !text) return;

  const user = getUser(senderId, senderName);

  const cmd = extractCommand(text);
  if (!cmd) return;

  if (cmd === '.help' || cmd === '.start') return sendMessage(chatId, getHelpText());
  if (cmd === '.bal' || cmd === '.balance' || cmd === '.money') return sendMessage(chatId, getBalText(user));
  if (cmd === '.me' || cmd === '.info') return sendMessage(chatId, getMeText(user));
  if (cmd === '.daily' || cmd === '.diemdanh') return sendMessage(chatId, getDailyText(user));
  if (cmd === '.top' || cmd === '.bxh') return sendMessage(chatId, getTopText());
  if (cmd === '.history' || cmd === '.ls') return sendMessage(chatId, getHistoryText());

  if (cmd === '.tx') {
    const lowerText = text.toLowerCase();
    const txIndex = lowerText.indexOf('.tx');
    const afterTx = text.substring(txIndex + 3).trim();
    const parts = afterTx.split(/\s+/);
    if (parts.length < 2) {
      return sendMessage(chatId, '❌ Cú pháp: .tx [tài/xỉu] [số tiền]\n\nVí dụ: .tx tài 10000\n\n' + DEV);
    }
    const choice = parts[0];
    const amount = parseInt(parts[1].replace(/[.,]/g, ''), 10);
    return handleBet(chatId, user, choice, amount);
  }

  if (cmd === '.dice') {
    const n = Math.floor(Math.random() * 6) + 1;
    return sendMessage(chatId, '🎲 Bạn lắc được: ' + DICE_EMOJI[n - 1] + ' (' + n + ')\n\n' + DEV);
  }

  if (cmd === '.coin') {
    const result = Math.random() < 0.5 ? 'Sấp' : 'Ngửa';
    return sendMessage(chatId, '🪙 Kết quả: ' + result + '\n\n' + DEV);
  }

  if (cmd === '.joke') {
    const jokes = [
      'Vì sao lập trình viên thích tối? Vì không có bug nào trong bóng tối! 😂',
      'Có 10 loại người: loại hiểu binary và loại không hiểu 🤖',
      'Tại sao con gà đi qua đường? Để sang bên kia đường 🐔'
    ];
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    return sendMessage(chatId, '😂 ' + joke + '\n\n' + DEV);
  }

  if (cmd === '.8ball' || cmd === '.boid') {
    const answers = [
      '🎱 Chắc chắn rồi!',
      '🎱 Không đâu bạn ơi!',
      '🎱 Có thể...',
      '🎱 Đừng mơ!',
      '🎱 Hỏi lại sau nhé!',
      '🎱 50/50 thôi!',
      '🎱 Tin vào bản thân đi!',
      '🎱 Câu trả lời là CÓ!'
    ];
    const answer = answers[Math.floor(Math.random() * answers.length)];
    return sendMessage(chatId, answer + '\n\n' + DEV);
  }

  return sendMessage(chatId, '❓ Lệnh không hợp lệ!\n\nGõ .help để xem danh sách lệnh\n\n' + DEV);
}

app.post('/webhook', async function(req, res) {
  res.json({ ok: true });
  try {
    await handleMessage(req.body);
  } catch (err) {
    console.error('Lỗi:', err);
  }
});

app.get('/', function(req, res) {
  res.send('Bot Tài Xỉu OK! | ' + DEV);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
  console.log('Bot chạy port ' + PORT);
  console.log(DEV);
});
