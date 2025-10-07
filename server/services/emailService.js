const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
  }

  /**
   * Create email transporter based on configuration
   */
  createTransporter() {
    const emailProvider = process.env.EMAIL_PROVIDER || 'console';
    
    switch (emailProvider) {
      case 'gmail':
        return nodemailer.createTransporter({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
          }
        });
      
      case 'smtp':
        return nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
      
      case 'sendgrid':
        return nodemailer.createTransporter({
          service: 'SendGrid',
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          }
        });
      
      case 'console':
      default:
        return {
          sendMail: async (options) => {
            console.log('\n' + '='.repeat(60));
            console.log('📧 EMAIL MESSAGE (Development Mode)');
            console.log('='.repeat(60));
            console.log(`To: ${options.to}`);
            console.log(`Subject: ${options.subject}`);
            console.log(`From: ${options.from}`);
            console.log('Body:');
            console.log(options.html || options.text);
            console.log('='.repeat(60) + '\n');
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return { messageId: `console_${Date.now()}` };
          }
        };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, resetToken, firstName = 'User') {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@medicineinventory.com',
      to: email,
      subject: 'Password Reset Request - Medicine Inventory',
      html: this.getPasswordResetEmailTemplate(firstName, resetUrl),
      text: this.getPasswordResetEmailText(firstName, resetUrl)
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Send OTP verification email (alternative to SMS)
   */
  async sendOTPEmail(email, otp, firstName = 'User') {
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@medicineinventory.com',
      to: email,
      subject: 'Password Reset Code - Medicine Inventory',
      html: this.getOTPEmailTemplate(firstName, otp),
      text: this.getOTPEmailText(firstName, otp)
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send OTP email');
    }
  }

  /**
   * Get password reset email HTML template
   */
  getPasswordResetEmailTemplate(firstName, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Medicine Inventory</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .button:hover { background: #5a6fd8; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
            <p>Medicine Inventory System</p>
          </div>
          <div class="content">
            <h2>Hello ${firstName}!</h2>
            <p>We received a request to reset your password for your Medicine Inventory account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <div class="warning">
              <strong>⚠️ Important Security Information:</strong>
              <ul>
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Never share this link with anyone</li>
                <li>Your password will not be changed until you click the link above</li>
              </ul>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">${resetUrl}</p>
          </div>
          <div class="footer">
            <p>This email was sent from Medicine Inventory System</p>
            <p>If you have any questions, please contact our support team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get password reset email text version
   */
  getPasswordResetEmailText(firstName, resetUrl) {
    return `
Password Reset Request - Medicine Inventory

Hello ${firstName}!

We received a request to reset your password for your Medicine Inventory account.

To reset your password, click the following link:
${resetUrl}

Important Security Information:
- This link will expire in 1 hour
- If you didn't request this reset, please ignore this email
- Never share this link with anyone
- Your password will not be changed until you click the link above

If you have any questions, please contact our support team.

Best regards,
Medicine Inventory System
    `;
  }

  /**
   * Get OTP email HTML template
   */
  getOTPEmailTemplate(firstName, otp) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Code - Medicine Inventory</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; text-align: center; background: white; padding: 20px; border-radius: 10px; margin: 20px 0; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Code</h1>
            <p>Medicine Inventory System</p>
          </div>
          <div class="content">
            <h2>Hello ${firstName}!</h2>
            <p>Use the following code to reset your password:</p>
            <div class="otp-code">${otp}</div>
            <div class="warning">
              <strong>⚠️ Important Security Information:</strong>
              <ul>
                <li>This code will expire in 10 minutes</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Never share this code with anyone</li>
                <li>Enter this code in the password reset form</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>This email was sent from Medicine Inventory System</p>
            <p>If you have any questions, please contact our support team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get OTP email text version
   */
  getOTPEmailText(firstName, otp) {
    return `
Password Reset Code - Medicine Inventory

Hello ${firstName}!

Use the following code to reset your password:

${otp}

Important Security Information:
- This code will expire in 10 minutes
- If you didn't request this reset, please ignore this email
- Never share this code with anyone
- Enter this code in the password reset form

Best regards,
Medicine Inventory System
    `;
  }
}

module.exports = new EmailService();
