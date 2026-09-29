const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const BASE_URL = `https://bot-api.zaloplatforms.com/bot${BOT_TOKEN}`;

async function sendMessage(chatId, text) {
  try {
    await axios.post(`${BASE_URL}/sendMessage`, {
      chat_id: chatId,
      text: text
    });
    console.log('✅ Đã gửi:', text);
  } catch (err) {
    console.error('❌ Lỗi:', err.response?.data || err.message);
  }
}

const CHOICES = [
  { name: 'Kéo', emoji: '✌️' },
  { name: 'Búa', emoji: '✊' },
  { name: 'Bao', emoji: '✋' }
];

function playOTT() {
  return CHOICES[Math.floor(Math.random() * CHOICES.length)];
}

app.post('/webhook', async (req, res) => {
  res.json({ ok: true });
  const update = req.body;
  console.log('📩 Nhận:', JSON.stringify(update));
  
  const message = update.message || update;
  const chatId = message.chat?.id || message.chat_id || message.from?.id;
  const text = (message.text || '').trim().toLowerCase();
  
  if (!chatId || !text) return;
  
  if (text === '.ott') {
    const result = playOTT();
    await sendMessage(chatId, 
      `🎲 ${result.emoji} ${result.name.toUpperCase()} ${result.emoji}`
    );
    return;
  }
  
  if (text === '.help' || text === '/start') {
    await sendMessage(chatId,
      `🤖 Bot Oẳn Tù Tì\n\n📌 Lệnh:\n• .ott - Chơi kéo búa bao\n• .help - Hướng dẫn`
    );
  }
});

app.get('/', (req, res) => res.send('🤖 Bot OK!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bot chạy port ${PORT}`));
