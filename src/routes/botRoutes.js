import { handleStart, handleRegistration } from '../controllers/studentController.js';
import { handleAdminAccess, handleStats, handleList } from '../controllers/adminController.js';

export const setupRoutes = (bot, userSessions) => {
  // Command handlers
  bot.onText(/\/start/, (msg) => handleStart(bot, msg));
  bot.onText(/\/admin/, (msg) => handleAdminAccess(bot, msg));
  bot.onText(/\/stats/, (msg) => handleStats(bot, msg));
  bot.onText(/\/list/, (msg) => handleList(bot, msg));

  // Message handler
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    let session = userSessions.get(chatId);

    if (!session) {
      userSessions.set(chatId, {
        step: 'start',
        data: {}
      });
      session = userSessions.get(chatId);
    }

    try {
      // Handle all registration steps
      if (session.step.startsWith('start') ||
        session.step.startsWith('fullName') ||
        session.step.startsWith('email') ||
        session.step.startsWith('section') ||
        session.step.startsWith('paymentMethod') ||
        session.step.startsWith('payment') ||
        session.step.startsWith('screenshot')) {

        const isComplete = await handleRegistration(bot, msg, session);
        if (isComplete) {
          userSessions.delete(chatId);
        }
      }
    } catch (error) {
      console.error('Message handling error:', error);
      bot.sendMessage(chatId, 'An error occurred. Please try again or contact support.');
    }
  });

  // Error handler
  bot.on('error', (error) => {
    console.error('Bot error:', error);
  });
}; 