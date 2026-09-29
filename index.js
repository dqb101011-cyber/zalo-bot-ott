// ====== XỬ LÝ TIN NHẮN ======
async function handleMessage(update) {
  console.log('📩 Nhận update:', JSON.stringify(update, null, 2));

  const message = update.message || update;
  if (!message) return;

  // ✅ LẤY chat.id - QUAN TRỌNG CHO NHÓM
  const chatId = message.chat?.id || message.chat_id;
  const chatType = message.chat?.chat_type || 'PRIVATE';  // PRIVATE hoặc GROUP
  const senderId = message.from?.id || message.from_id || 'unknown';
  const senderName = message.from?.display_name || message.from?.name || 'Người chơi';

  const text = (message.text || '').trim();
  const textLower = text.toLowerCase();

  if (!chatId || !text) return;

  const user = getUser(senderId, senderName);

  console.log(`💬 chatId: ${chatId}`);
  console.log(`💬 chatType: ${chatType}`);
  console.log(`💬 sender: ${senderName} (${senderId})`);
  console.log(`💬 text gốc: "${text}"`);
  console.log(`💬 text lower: "${textLower}"`);

  // ✅ BƯỚC QUAN TRỌNG: LỌC BỎ MENTION
  // Trong nhóm, text có thể là "@Bot Quốc Bảo .ott"
  // Cần bỏ phần "@Bot Quốc Bảo" để lấy ".ott"
  let cleanText = textLower;
  
  // Nếu có @ ở đầu, cắt bỏ phần mention
  if (cleanText.includes('@')) {
    // Tìm dấu cách cuối cùng sau @... 
    // Cách đơn giản: tìm lệnh có dấu chấm (.)
    const cmdMatch = textLower.match(/\.[a-z0-9]+/);
    if (cmdMatch) {
      cleanText = cmdMatch[0];
      console.log(`💬 cleanText: "${cleanText}"`);
    }
  }

  // ===== .help =====
  if (cleanText === '.help' || cleanText === '/start') {
    return sendMessage(chatId, getHelpText());
  }

  // ===== .bal =====
  if (cleanText === '.bal' || cleanText === '.balance' || cleanText === '.money') {
    return sendMessage(chatId, getBalText(user));
  }

  // ===== .me =====
  if (cleanText === '.me' || cleanText === '.info') {
    return sendMessage(chatId, getMeText(user));
  }

  // ===== .daily =====
  if (cleanText === '.daily' || cleanText === '.diemdanh') {
    return sendMessage(chatId, getDailyText(user));
  }

  // ===== .top =====
  if (cleanText === '.top' || cleanText === '.bxh') {
    return sendMessage(chatId, getTopText());
  }

  // ===== .history =====
  if (cleanText === '.history' || cleanText === '.ls') {
    return sendMessage(chatId, getHistoryText());
  }

  // ===== .tx [choice] [amount] =====
  if (cleanText.startsWith('.tx')) {
    // Dùng text gốc (đã bỏ mention) để lấy đúng tham số
    const parts = text.replace(/@\S+/g, '').trim().split(/\s+/);
    
    // Nếu vẫn còn @ trong text → cắt lại
    const cleanedParts = parts.filter(p => p.startsWith('.') || !p.startsWith('@'));
    
    if (cleanedParts.length < 3) {
      return sendMessage(chatId, `❌ Cú pháp: .tx [tài/xỉu] [số tiền]\n\nVí dụ: .tx tài 10000\n\n${DEV}`);
    }
    const choice = cleanedParts[1];
    const amount = parseInt(cleanedParts[2].replace(/[.,]/g, ''));
    return handleBet(chatId, user, choice, amount);
  }

  // ===== .dice =====
  if (cleanText === '.dice') {
    const n = Math.floor(Math.random() * 6) + 1;
    return sendMessage(chatId, `🎲 Bạn lắc được: ${DICE_EMOJI[n - 1]} (${n})\n\n${DEV}`);
  }

  // ===== .coin =====
  if (cleanText === '.coin') {
    const result = Math.random() < 0.5 ? 'Sấp' : 'Ngửa';
    return sendMessage(chatId, `🪙 Kết quả: ${result}\n\n${DEV}`);
  }

  // ===== .joke =====
  if (cleanText === '.joke') {
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
  if (cleanText.startsWith('.8ball') || cleanText.startsWith('.boid')) {
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
  if (cleanText.startsWith('.')) {
    return sendMessage(chatId, `❓ Lệnh không hợp lệ!\n\nGõ .help để xem danh sách lệnh\n\n${DEV}`);
  }
}
