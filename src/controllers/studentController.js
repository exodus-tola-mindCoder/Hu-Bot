import { generatePaymentReference, generatePaymentInstructions } from '../utils/paymentUtils.js';

// In-memory storage for students and payments
const students = new Map();
const payments = new Map();

export const handleStart = async (bot, msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
Welcome to Haramaya University Placement System! 🎓

Please enter your Student ID to begin registration.
`;

  bot.sendMessage(chatId, welcomeMessage);
};

export const handleRegistration = async (bot, msg, session) => {
  const chatId = msg.chat.id;

  if (msg.text && msg.text !== '/start') {
    switch (session.step) {
      case 'start':
        session.data.studentId = msg.text;
        session.step = 'fullName';
        bot.sendMessage(chatId, 'Please enter your full name:');
        break;

      case 'fullName':
        session.data.fullName = msg.text;
        session.step = 'email';
        bot.sendMessage(chatId, 'Please enter your email:');
        break;

      case 'email':
        session.data.email = msg.text;
        session.step = 'section';
        bot.sendMessage(chatId, 'Please enter your section (e.g., FN-1, FS-1):');
        break;

      case 'section':
        session.data.section = msg.text;
        session.step = 'paymentMethod';
        const paymentMethodMessage = `
Please select your payment method:

1. CBE Birr
2. TeleBirr

Reply with either "1" for CBE or "2" for TeleBirr.
`;

        bot.sendMessage(chatId, paymentMethodMessage);
        break;

      case 'paymentMethod':
        if (msg.text === '1') {
          session.data.paymentMethod = 'CBE';
          session.step = 'payment';
          const paymentMessage = `
Please make your payment using CBE Birr:

Account Number: 1000585062867
Amount: 100 ETB

After making the payment:
1. Enter your FT number
2. Upload the payment screenshot
`;

          bot.sendMessage(chatId, paymentMessage);
        } else if (msg.text === '2') {
          session.data.paymentMethod = 'TeleBirr';
          session.step = 'payment';
          const paymentMessage = `
Please make your payment using TeleBirr:

Account Number: 0905355356
Amount: 100 ETB

After making the payment:
1. Enter your FT number
2. Upload the payment screenshot
`;

          bot.sendMessage(chatId, paymentMessage);
        } else {
          bot.sendMessage(chatId, 'Please select either "1" for CBE or "2" for TeleBirr.');
        }
        break;

      case 'payment':
        if (msg.text) {
          // Handle FT number
          session.data.ftNumber = msg.text;
          session.step = 'screenshot';
          bot.sendMessage(chatId, 'Please upload your payment screenshot:');
        }
        break;

      case 'screenshot':
        if (msg.photo) {
          const photo = msg.photo[msg.photo.length - 1];
          try {
            // Store student data
            const studentData = {
              telegramId: chatId.toString(),
              ...session.data,
              registrationDate: new Date().toISOString()
            };
            students.set(chatId.toString(), studentData);

            // Store payment data
            const paymentData = {
              studentId: studentData.studentId,
              ftNumber: studentData.ftNumber,
              amount: 100,
              paymentMethod: studentData.paymentMethod,
              screenshotFileId: photo.file_id,
              paymentDate: new Date().toISOString(),
              status: 'pending'
            };
            payments.set(chatId.toString(), paymentData);

            const successMessage = `
✅ Registration and Payment Successful!

Thank you for registering. Your payment will be verified shortly.
You will receive the system access link once your payment is confirmed.

Registration Details:
Student ID: ${studentData.studentId}
Name: ${studentData.fullName}
Email: ${studentData.email}
Section: ${studentData.section}
Payment Method: ${studentData.paymentMethod}
Amount: ${paymentData.amount} ETB
FT Number: ${paymentData.ftNumber}
`;

            bot.sendMessage(chatId, successMessage);
            return true; // Registration complete
          } catch (error) {
            console.error('Registration error:', error);
            bot.sendMessage(chatId,
              'Sorry, there was an error processing your registration. Please try again or contact support.'
            );
          }
        } else {
          bot.sendMessage(chatId, 'Please upload a photo of your payment screenshot.');
        }
        break;
    }
  }
  return false;
};

export const handlePayment = async (bot, msg) => {
  const chatId = msg.chat.id;

  try {
    const student = students.get(chatId.toString());

    if (!student) {
      bot.sendMessage(chatId,
        'You need to register first. Please use /start command.'
      );
      return;
    }

    const paymentReference = generatePaymentReference(student.studentId);

    // Store payment data in memory
    const paymentData = {
      studentId: student.studentId,
      paymentReference,
      amount: 100,
      paymentMethod: 'pending',
      createdAt: new Date().toISOString()
    };
    payments.set(paymentReference, paymentData);

    bot.sendMessage(chatId, generatePaymentInstructions(paymentReference));
  } catch (error) {
    console.error('Payment initiation error:', error);
    bot.sendMessage(chatId,
      'Sorry, there was an error processing your request. Please try again later.'
    );
  }
};

export const handlePaymentScreenshot = async (bot, msg) => {
  const chatId = msg.chat.id;

  if (msg.photo) {
    const photo = msg.photo[msg.photo.length - 1];
    try {
      const student = students.get(chatId.toString());
      if (!student) {
        bot.sendMessage(chatId, 'Please register first using /start command.');
        return;
      }

      // Find pending payment for this student
      const pendingPayment = Array.from(payments.values())
        .find(p => p.studentId === student.studentId && p.paymentMethod === 'pending');

      if (pendingPayment) {
        pendingPayment.screenshotFileId = photo.file_id;
        pendingPayment.paymentDate = new Date().toISOString();
        pendingPayment.paymentMethod = 'submitted';

        bot.sendMessage(chatId,
          '✅ Thank you! Your payment screenshot has been received.\n\n' +
          'Our admin team will verify your payment and update your status.\n' +
          'You can check your payment status using /status command.'
        );
      }
    } catch (error) {
      console.error('Payment screenshot error:', error);
      bot.sendMessage(chatId,
        'Sorry, there was an error processing your payment screenshot. Please try again later.'
      );
    }
  } else {
    bot.sendMessage(chatId, 'Please upload a photo of your payment screenshot.');
  }
};

export const handleStatus = async (bot, msg) => {
  const chatId = msg.chat.id;

  try {
    const student = students.get(chatId.toString());

    if (!student) {
      bot.sendMessage(chatId,
        'You need to register first. Please use /start command.'
      );
      return;
    }

    // Find completed payment for this student
    const payment = Array.from(payments.values())
      .find(p => p.studentId === student.studentId && p.paymentMethod === 'completed');

    if (payment) {
      bot.sendMessage(chatId,
        `✅ Your payment has been verified!\n\n` +
        `Amount: ${payment.amount} ETB\n` +
        `Date: ${new Date(payment.paymentDate).toLocaleDateString()}`
      );
    } else {
      bot.sendMessage(chatId,
        '❌ No verified payment found. Please use /start to make a payment.'
      );
    }
  } catch (error) {
    console.error('Status check error:', error);
    bot.sendMessage(chatId,
      'Sorry, there was an error checking your status. Please try again later.'
    );
  }
}; 