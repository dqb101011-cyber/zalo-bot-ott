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

// ====== LƯU TRỮ ======
const users = {};
let sessionId = 0;
let history = [];

// ====== GỬI TIN NHẮN ======
async function sendMessage(chatId, text) {
  try {
    await axios.post(`${BASE_URL}/sendMessage`, {
      chat_id: chatId,
      text: text
    });
    console.log(`✅ Gửi tới ${chatId}`);
  } catch (err) {
    console.error('❌ Lỗi gửi:', err.response?.data || err.message);
  }
}

// ====== TÀI XỈU ======
const DICE_EMOJI = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

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
  return { dice, total, result };
}

// ====== QUẢN LÝ USER ======
function getUser(userId, name = 'Người chơi') {
  if (!users[userId]) {
    users[userId] = {
      balance: START_BALANCE,
      lastDaily: 0,
      name: name,
      winCount: 0,
      loseCount: 0,
      totalBet: 0,
      createdAt: Date.now()
    };
    console.log(`👤 User mới: ${name} (${userId}) +${START_BALANCE} VND`);
  }
  return users[userId];
}

function formatMoney(amount) {
  return amount.toLocaleString('vi-VN') + ' VND';
}

// ====== TEXT CÁC LỆNH ======
function getHelpText() {
  return `🎰 BOT TÀI XỈU 🎰
━━━━━━━━━━━━━━━━━━

💰 LỆNH TIỀN TỆ:
• .tx [tài/xỉu] [tiền] - Cược tài xỉu
   VD: .tx tài 10000
• .bal - Xem số dư
• .daily - Nhận 100k mỗi 24h
• .top - Bảng xếp hạng
• .history - Lịch sử cược

🎮 LỆNH GIẢI TRÍ:
• .dice - Lắc xúc xắc
• .coin - Tung đồng xu
• .joke - Chuyện cười
• .8ball [câu hỏi] - Quả cầu tiên tri
• .me - Thông tin bản thân
• .help - Xem hướng dẫn

━━━━━━━━━━━━━━━━━━
🎁 Mới vào: +100.000 VND
🎁 Mỗi 24h: +100.000 VND
━━━━━━━━━━━━━━━━━━
${DEV}`;
}

function getBalText(user) {
  return `💰 SỐ DƯ CỦA BẠN
━━━━━━━━━━━━━━━━━━
👤 Tên: ${user.name}
💵 Số dư: ${formatMoney(user.balance)}
🏆 Thắng: ${user.winCount} | 💀 Thua: ${user.loseCount}
🎯 Tổng cược: ${formatMoney(user.totalBet)}
━━━━━━━━━━━━━━━━━━
${DEV}`;
}

function getMeText(user) {
  return `👤 THÔNG TIN CÁ NHÂN
━━━━━━━━━━━━━━━━━━
📛 Tên: ${user.name}
💵 Số dư: ${formatMoney(user.balance)}
🏆 Thắng: ${user.winCount}
💀 Thua: ${user.loseCount}
🎯 Tổng cược: ${formatMoney(user.totalBet)}
📅 Tham gia: ${new Date(user.createdAt).toLocaleString('vi-VN')}
━━━━━━━━━━━━━━━━━━
${DEV}`;
}

function getTopText() {
  const sorted = Object.entries(users)
    .sort((a, b) => b[1].balance - a[1].balance)
    .slice(0, 10);

  if (sorted.length === 0) {
    return `🏆 BẢNG XẾP HẠNG\n━━━━━━━━━━━━━━━━━━\nChưa có ai chơi!\n━━━━━━━━━━━━━━━━━━\n${DEV}`;
  }

  let text = `🏆 TOP 10 ĐẠI GIA\n━━━━━━━━━━━━━━━━━━\n`;
  sorted.forEach((entry, idx) => {
    const u = entry[1];
    const medal = ['🥇', '🥈', '🥉'][idx] || `${idx + 1}.`;
    text += `${medal} ${u.name}: ${formatMoney(u.balance)}\n`;
  });
  text += `━━━━━━━━━━━━━━━━━━\n${DEV}`;
  return text;
}

function getHistoryText() {
  if (history.length === 0) {
    return `📜 LỊCH SỬ\n━━━━━━━━━━━━━━━━━━\nChưa có phiên nào!\n━━━━━━━━━━━━━━━━━━\n${DEV}`;
  }

  const recent = history.slice(-10).reverse();
  let text = `📜 10 PHIÊN GẦN NHẤT\n━━━━━━━━━━━━━━━━━━\n`;
  recent.forEach(h => {
    text += `#${String(h.id).padStart(5, '0')} | ${h.dice.join('-')} = ${h.total} | ${h.result}\n`;
  });
  text += `━━━━━━━━━━━━━━━━━━\n${DEV}`;
  return text;
}

function getDailyText(user) {
  const now = Date.now();
  const elapsed = now - user.lastDaily;

  if (elapsed < DAILY_COOLDOWN) {
    const remaining = DAILY_COOLDOWN - elapsed;
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    return `⏳ CHƯA ĐẾN LƯỢT NHẬN
━━━━━━━━━━━━━━━━━━
Bạn đã nhận daily rồi!
⏰ Còn lại: ${hours}h ${minutes}m
━━━━━━━━━━━━━━━━━━
${DEV}`;
  }

  user.balance += DAILY_AMOUNT;
  user.lastDaily = now;
  return `🎁 NHẬN DAILY THÀNH CÔNG!
━━━━━━━━━━━━━━━━━━
💰 +${formatMoney(DAILY_AMOUNT)}
💵 Số dư mới: ${formatMoney(user.balance)}
⏰ Nhận lại sau: 24h
━━━━━━━━━━━━━━━━━━
${DEV}`;
}

// ====== XỬ LÝ CƯỢC ======
async function handleBet(chatId, user, choice, amount) {
  const choiceLower = choice.toLowerCase();
  let validChoice = null;

  if (choiceLower === 'tai' || choiceLower === 'tài') validChoice = 'Tài';
  else if (choiceLower === 'xiu' || choiceLower === 'xỉu') validChoice = 'Xỉu';

  if (!validChoice) {
    return sendMessage(chatId, `❌ Sai cú pháp!\n\nDùng: .tx tài 10000\nHoặc: .tx xỉu 10000\n\n${DEV}`);
  }

  if (isNaN(amount) || amount <= 0) {
    return sendMessage(chatId, `❌ Số tiền không hợp lệ!\n\nVí dụ: .tx tài 10000\n\n${DEV}`);
  }

  amount = Math.floor(amount);

  if (amount < MIN_BET) {
    return sendMessage(chatId, `❌ Cược tối thiểu: ${formatMoney(MIN_BET)}\n\n${DEV}`);
  }

  if (amount > MAX_BET) {
    return sendMessage(chatId, `❌ Cược tối đa: ${formatMoney(MAX_BET)}\n\n${DEV}`);
  }

  if (user.balance < amount) {
    return sendMessage(chatId, `❌ Không đủ tiền!\n\n💵 Số dư: ${formatMoney(user.balance)}\n💸 Cần: ${formatMoney(amount)}\n\nDùng .daily để nhận tiền!\n\n${DEV}`);
  }

  user.balance -= amount;
  user.totalBet += amount;

  sessionId++;
  const game = playTaiXiu();
  const diceStr = `${DICE_EMOJI[game.dice[0] - 1]} ${DICE_EMOJI[game.dice[1] - 1]} ${DICE_EMOJI[game.dice[2] - 1]}`;
  const totalStr = `${game.dice[0]} + ${game.dice[1]} + ${game.dice[2]} = ${game.total}`;

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

  const sessionStr = `#${String(sessionId).padStart(5, '0')}`;
  const isWin = validChoice === game.result;

  if (isWin) {
    const winAmount = amount * 2;
    user.balance += winAmount;
    user.winCount++;

    return sendMessage(chatId, `🎰 PHIÊN ${sessionStr}
━━━━━━━━━━━━━━━━━━
🎲 Xúc xắc: ${diceStr}
📊 Tổng: ${totalStr}
🎯 Kết quả: ${game.result === 'Tài' ? '🔴 TÀI' : '🔵 XỈU'}
━━━━━━━━━━━━━━━━━━
🎉 BẠN THẮNG!
✅ Cược: ${validChoice} - ${formatMoney(amount)}
💰 Nhận: +${formatMoney(winAmount)}
💵 Số dư: ${formatMoney(user.balance)}
━━━━━━━━━━━━━━━━━━
${DEV}`);
  } else {
    user.loseCount++;
    return sendMessage(chatId, `🎰 PHIÊN ${sessionStr}
━━━━━━━━━━━━━━━━━━
🎲 Xúc xắc: ${diceStr}
📊 Tổng: ${totalStr}
🎯 Kết quả: ${game.result === 'Tài' ? '🔴 TÀI' : '🔵 XỈU'}
━━━━━━━━━━━━━━━━━━
😢 BẠN THUA!
❌ Cược: ${validChoice} - ${formatMoney(amount)}
💸 Mất: -${formatMoney(amount)}
💵 Số dư: ${formatMoney(user.balance)}
━━━━━━━━━━━━━━━━━━
${DEV}`);
  }
}

// ====== XỬ LÝ TIN NHẮN ======
async function handleMessage(update) {
  console.log('📩 Nhận:', JSON.stringify(update, null, 2));

  const message = update.message || update;
  if (!message) return;

  const chatId = message.chat?.id || message.chat_id;
  const senderId = message.from?.id || message.from_id || 'unknown';
  const senderName = message.from?.display_name || message.from?.name || 'Người chơi';

  const text = (message.text || '').trim();
  const textLower = text.toLowerCase();

  if (!chatId || !text) return;

  const user = getUser(senderId, senderName);

  console.log(`💬 chat: ${chatId} | user: ${senderName} | text: ${text}`);

  // ===== .help =====
  if (textLower === '.help' || textLower === '/start') {
    return sendMessage(chatId, getHelpText());
  }

  // ===== .bal =====
  if (textLower === '.bal' || textLower === '.balance' || textLower === '.money') {
    return sendMessage(chatId, getBalText(user));
  }

  // ===== .me =====
  if (textLower === '.me' || textLower === '.info') {
    return sendMessage(chatId, getMeText(user));
  }

  // ===== .daily =====
  if (textLower === '.daily' || textLower === '.diemdanh') {
    return sendMessage(chatId, getDailyText(user));
  }

  // ===== .top =====
  if (textLower === '.top' || textLower === '.bxh') {
    return sendMessage(chatId, getTopText());
  }

  // ===== .history =====
  if (textLower === '.history' || textLower === '.ls') {
    return sendMessage(chatId, getHistoryText());
  }

  // ===== .tx [choice] [amount] =====
  if (textLower.startsWith('.tx')) {
    const parts = text.split(/\s+/);
    if (parts.length < 3) {
      return sendMessage(chatId, `❌ Cú pháp: .tx [tài/xỉu] [số tiền]\n\nVí dụ: .tx tài 10000\n\n${DEV}`);
    }
    const choice = parts[1];
    const amount = parseInt(parts[2].replace(/[.,]/g, ''));
    return handleBet(chatId, user, choice, amount);
  }

  // ===== .dice =====
  if (textLower === '.dice') {
    const n = Math.floor(Math.random() * 6) + 1;
    return sendMessage(chatId, `🎲 Bạn lắc được: ${DICE_EMOJI[n - 1]} (${n})\n\n${DEV}`);
  }

  // ===== .coin =====
  if (textLower === '.coin') {
    const result = Math.random() < 0.5 ? 'Sấp' : 'Ngửa';
    return sendMessage(chatId, `🪙 Kết quả: ${result}\n\n${DEV}`);
  }

  // ===== .joke =====
  if (textLower === '.joke') {
    const jokes = [
      'Vì sao lập trình viên thích tối? Vì không có bug nào trong bóng tối! 😂',
      'Có 10 loại người: loại hiểu binary và loại không hiểu 🤖',
      'Tại sao con gà đi qua đường? Để sang bên kia đường 🐔',
      'Bạn có biết tại sao cá không nói chuyện không? Vì chúng sợ bị "câu" 😆',
      'Hôm nay tôi bị ốm... ốm tiền 💸'
    ];
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    return sendMessage(chatId, `😂 ${joke}\n\n${DEV}`);
  }

  // ===== .8ball =====
  if (textLower.startsWith('.8ball') || textLower.startsWith('.boid')) {
    const answers = [
      '🎱 Chắc chắn rồi!',
      '🎱 Không đâu bạn ơi!',
      '🎱 Có thể...',
      '🎱 Đừng mơ!',
      '🎱 Hỏi lại sau nhé!',
      '🎱 50/50 thôi!',
      '🎱 Tin vào bản thân đi!',
      '🎱 Câu trả lời là CÓ!',
      '🎱 Chắc là KHÔNG!',
      '🎱 Chuyện nhỏ, làm được!'
    ];
    const answer = answers[Math.floor(Math.random() * answers.length)];
    return sendMessage(chatId, `${answer}\n\n${DEV}`);
  }

  // ===== Lệnh lạ =====
  if (textLower.startsWith('.')) {
    return sendMessage(chatId, `❓ Lệnh không hợp lệ!\n\nGõ .help để xem danh sách lệnh\n\n${DEV}`);
  }
}

// ====== WEBHOOK ======
app.post('/webhook', async (req, res) => {
  res.json({ ok: true });
  try {
    await handleMessage(req.body);
  } catch (err) {
    console.error('❌ Lỗi:', err);
  }
});

// ====== HEALTH CHECK ======
app.get('/', (req, res) => {
  res.send(`🤖 Bot Tài Xỉu OK! | ${DEV}`);
});

// ====== KHỞI ĐỘNG ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Bot chạy port ${PORT}`);
  console.log(`🎰 Game: Tài Xỉu`);
  console.log(`👨‍💻 ${DEV}`);
});
