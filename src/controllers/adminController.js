// In-memory storage for admins
const admins = new Map();

// Initialize admin
const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID;
if (ADMIN_TELEGRAM_ID) {
  admins.set(ADMIN_TELEGRAM_ID, {
    telegramId: ADMIN_TELEGRAM_ID,
    role: 'super_admin',
    isActive: true
  });
}

export const handleAdminAccess = async (bot, msg) => {
  const chatId = msg.chat.id;

  try {
    const admin = admins.get(chatId.toString());

    if (!admin) {
      bot.sendMessage(chatId, 'Unauthorized access.');
      return;
    }

    const adminMessage = `
🔑 Admin Dashboard

Available commands:
1. /stats - View registration and payment statistics
2. /list - View all registered students
`;

    bot.sendMessage(chatId, adminMessage);
  } catch (error) {
    console.error('Admin access error:', error);
    bot.sendMessage(chatId, 'An error occurred. Please try again later.');
  }
};

export const handleStats = async (bot, msg) => {
  const chatId = msg.chat.id;

  try {
    const admin = admins.get(chatId.toString());
    if (!admin) {
      bot.sendMessage(chatId, 'Unauthorized access.');
      return;
    }

    // Calculate statistics
    const allStudents = Array.from(students.values());
    const allPayments = Array.from(payments.values());
    const totalStudents = allStudents.length;
    const totalPayments = allPayments.length;
    const totalAmount = allPayments.reduce((sum, p) => sum + p.amount, 0);

    const statsMessage = `
📊 Registration and Payment Statistics

Total Students Registered: ${totalStudents}
Total Payments Received: ${totalPayments}
Total Amount Collected: ${totalAmount} ETB

Payment Methods Used:
CBE Birr: ${allPayments.filter(p => p.paymentMethod === 'CBE').length}
TeleBirr: ${allPayments.filter(p => p.paymentMethod === 'TeleBirr').length}
`;

    bot.sendMessage(chatId, statsMessage);
  } catch (error) {
    console.error('Stats error:', error);
    bot.sendMessage(chatId, 'An error occurred. Please try again later.');
  }
};

export const handleList = async (bot, msg) => {
  const chatId = msg.chat.id;

  try {
    const admin = admins.get(chatId.toString());
    if (!admin) {
      bot.sendMessage(chatId, 'Unauthorized access.');
      return;
    }

    const allStudents = Array.from(students.values());
    const allPayments = Array.from(payments.values());

    let message = '📝 Registered Students:\n\n';

    allStudents.forEach((student, index) => {
      const payment = allPayments.find(p => p.studentId === student.studentId);
      message += `${index + 1}. ${student.fullName}\n`;
      message += `   ID: ${student.studentId}\n`;
      message += `   Email: ${student.email}\n`;
      message += `   Section: ${student.section}\n`;
      message += `   Payment: ${payment ? '✅ Paid' : '❌ Not Paid'}\n`;
      if (payment) {
        message += `   FT Number: ${payment.ftNumber}\n`;
        message += `   Amount: ${payment.amount} ETB\n`;
      }
      message += '\n';
    });

    // Split message if too long
    if (message.length > 4000) {
      const chunks = message.match(/.{1,4000}/g) || [];
      for (const chunk of chunks) {
        await bot.sendMessage(chatId, chunk);
      }
    } else {
      bot.sendMessage(chatId, message);
    }
  } catch (error) {
    console.error('List error:', error);
    bot.sendMessage(chatId, 'An error occurred. Please try again later.');
  }
}; 