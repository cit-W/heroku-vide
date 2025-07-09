import nodemailer from 'nodemailer';
import { promisify } from 'util';

const createTestAccount = promisify(nodemailer.createTestAccount);

let transporter;

async function initializeMailer() {
  try {
    const testAccount = await createTestAccount();
    console.log('Credentials obtained, sending message...');
    console.log('User: %s', testAccount.user);
    console.log('Password: %s', testAccount.pass);
    console.log('SMTP server: %s', testAccount.smtp.host);
    console.log('SMTP port: %s', testAccount.smtp.port);
    console.log('Secure: %s', testAccount.smtp.secure);

    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch (err) {
    console.error('Failed to create a test account. ' + err.message);
    process.exit(1);
  }
}

initializeMailer();

export { transporter };
