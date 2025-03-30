import { handleStart, handleRegistration } from '../controllers/studentController.js';
import { handleAdminAccess, handleStats, handleList, handleVerify } from '../controllers/adminController.js';

export const setupRoutes = (bot, userSessions) => {
  // Storage for students and payments
  const students = new Map();
  const payments = new Map();

  // Command handlers
  bot.onText(/\/start/, (msg) => handleStart(bot, msg));
  bot.onText(/\/admin/, (msg) => handleAdminAccess(bot, msg));
  bot.onText(/\/stats/, (msg) => handleStats(bot, msg));
  bot.onText(/\/list/, (msg) => handleList(bot, msg));
  bot.onText(/\/verify (.+)/, (msg) => handleVerify(bot, msg, userSessions, students, payments));

  // Message handler
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    let session = userSessions.get(chatId);

    console.log('Received message type:', msg.photo ? 'photo' : 'text', 'for chat:', chatId); // Debug log

    if (!session) {
      userSessions.set(chatId, {
        step: 'start',
        data: {}
      });
      session = userSessions.get(chatId);
    }

    try {
      // Handle registration steps
      if (session) {
        console.log('Processing message for step:', session.step); // Debug log
        const isComplete = await handleRegistration(bot, msg, session);

        if (isComplete) {
          console.log('Registration completed for chat:', chatId); // Debug log
          userSessions.delete(chatId);
        }
      }
    } catch (error) {
      console.error('Message handling error:', error);
      await bot.sendMessage(chatId, 'An error occurred. Please try again or contact support.');
    }
  });

  // Error handler
  bot.on('error', (error) => {
    console.error('Bot error:', error);
  });
}; 