// In-memory storage for admins
const admins = new Map();

// Initialize admin with ADMIN_TELEGRAM_ID from environment variables
if (process.env.ADMIN_TELEGRAM_ID) {
  admins.set(process.env.ADMIN_TELEGRAM_ID, {
    role: 'admin'
  });
}

export const handleAdminAccess = async (bot, msg) => {
  const chatId = msg.chat.id;

  if (!admins.has(chatId.toString())) {
    await bot.sendMessage(chatId, '⛔ Sorry, you do not have admin access.');
    return;
  }

  const adminMenu = `
🔰 Admin Dashboard

Available Commands:
/stats - View registration and payment statistics
/list - List all registered students
/verify [chatId] - Verify a student's payment

Need help? Contact system administrator.
`;

  await bot.sendMessage(chatId, adminMenu);
};

export const handleVerify = async (bot, msg, userSessions, students, payments) => {
  const chatId = msg.chat.id;

  if (!admins.has(chatId.toString())) {
    await bot.sendMessage(chatId, '⛔ Sorry, you do not have admin access.');
    return;
  }

  const args = msg.text.split(' ');
  if (args.length !== 2) {
    await bot.sendMessage(chatId, '❌ Please provide the student\'s chat ID. Usage: /verify [chatId]');
    return;
  }

  const studentChatId = args[1];
  const student = students.get(studentChatId);
  const payment = payments.get(studentChatId);

  if (!student || !payment) {
    await bot.sendMessage(chatId, '❌ Student not found or no payment record exists.');
    return;
  }

  // Update payment status
  payment.status = 'verified';
  payments.set(studentChatId, payment);

  // Notify the student
  const verificationMessage = `
✅ Payment Verified Successfully!

Your payment of ${payment.amount} ETB has been verified.
You can now access the Placement System at:
🔗 https://fresh-placement.vercel.app/

Please complete your department selection process.

Need help? Use /start to contact support.
`;

  try {
    await bot.sendMessage(studentChatId, verificationMessage);
    await bot.sendMessage(chatId, `✅ Payment verified and student notified successfully.`);
  } catch (error) {
    console.error('Error sending verification message:', error);
    await bot.sendMessage(chatId, '❌ Error notifying student. Please try again.');
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