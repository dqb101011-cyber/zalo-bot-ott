const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const BASE_URL = `https://bot-api.zaloplatforms.com/bot${BOT_TOKEN}`;

// ====== Gửi tin nhắn ======
async function sendMessage(chatId, text) {
  try {
    const res = await axios.post(`${BASE_URL}/sendMessage`, {
      chat_id: chatId,
      text: text
    });
    console.log(`✅ Đã gửi tới ${chatId}:`, text);
    return res.data;
  } catch (err) {
    console.error('❌ Lỗi gửi:', err.response?.data || err.message);
  }
}

// ====== Kéo búa bao ======
const CHOICES = [
  { name: 'Kéo', emoji: '✌️' },
  { name: 'Búa', emoji: '✊' },
  { name: 'Bao', emoji: '✋' }
];

function playOTT() {
  return CHOICES[Math.floor(Math.random() * CHOICES.length)];
}

// ====== Xử lý tin nhắn ======
async function handleMessage(update) {
  console.log('📩 Nhận update:', JSON.stringify(update, null, 2));

  // Lấy message từ update
  const message = update.message || update;
  if (!message) {
    console.log('⚠️ Không có message');
    return;
  }

  // ✅ LẤY chat.id (dùng cho cả PRIVATE và GROUP)
  const chatId = message.chat?.id || message.chat_id;
  const chatType = message.chat?.chat_type || 'PRIVATE';
  const senderId = message.from?.id || message.from_id;

  // Lấy text
  const text = (message.text || '').trim();
  const textLower = text.toLowerCase();

  console.log(`💬 chatId: ${chatId}`);
  console.log(`💬 chatType: ${chatType}`);
  console.log(`💬 senderId: ${senderId}`);
  console.log(`💬 text: "${text}"`);

  // Không có chatId → không làm gì
  if (!chatId) {
    console.log('⚠️ Không có chatId');
    return;
  }

  // Không có text → không làm gì
  if (!text) {
    console.log('⚠️ Không có text');
    return;
  }

  // ====== LỆNH .ott ======
  // Dùng includes vì trong nhóm text có thể là "@Bot Quốc Bảo .ott"
  if (textLower.includes('.ott')) {
    const result = playOTT();
    const reply = `🎲 ${result.emoji} ${result.name.toUpperCase()} ${result.emoji}`;
    await sendMessage(chatId, reply);
    return;
  }

  // ====== LỆNH .help ======
  if (textLower.includes('.help') || textLower.includes('/start')) {
    const help = 
      `🤖 Bot Oẳn Tù Tì\n\n` +
      `📌 Danh sách lệnh:\n` +
      `• .ott - Chơi kéo búa bao\n` +
      `• .help - Xem hướng dẫn\n\n` +
      `Chúc bạn chơi vui! 🎉`;
    await sendMessage(chatId, help);
    return;
  }

  // ====== Lệnh lạ (bắt đầu bằng dấu chấm) ======
  if (textLower.startsWith('.')) {
    await sendMessage(chatId, `❓ Lệnh không hợp lệ. Gõ .help để xem danh sách.`);
  }
}

// ====== Webhook ======
app.post('/webhook', async (req, res) => {
  // Trả lời Zalo ngay để tránh timeout
  res.json({ ok: true });

  try {
    await handleMessage(req.body);
  } catch (err) {
    console.error('❌ Lỗi xử lý:', err);
  }
});

// ====== Health check ======
app.get('/', (req, res) => {
  res.send('🤖 Bot OK!');
});

// ====== Khởi động ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Bot chạy port ${PORT}`);
});
