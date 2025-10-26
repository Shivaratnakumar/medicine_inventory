const crypto = require('crypto');
const axios = require('axios');

class RealSMSService {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'textbelt'; // 'console', 'twilio', 'textbelt', 'aws-sns'
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.textbeltApiKey = process.env.TEXTBELT_API_KEY || 'textbelt'; // Free tier
  }

  /**
   * Generate a secure 6-digit OTP
   */
  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Send OTP via SMS
   * @param {string} phoneNumber - Phone number to send OTP to
   * @param {string} otp - OTP code to send
   * @param {string} type - Type of OTP (password_reset, phone_verification)
   * @returns {Promise<Object>} - Result of SMS sending
   */
  async sendOTP(phoneNumber, otp, type = 'password_reset') {
    try {
      const message = this.formatMessage(otp, type);
      
      switch (this.provider) {
        case 'twilio':
          return await this.sendViaTwilio(phoneNumber, message);
        case 'textbelt':
          return await this.sendViaTextBelt(phoneNumber, message);
        case 'aws-sns':
          return await this.sendViaAWSSNS(phoneNumber, message);
        case 'console':
        default:
          return await this.sendViaConsole(phoneNumber, message, otp);
      }
    } catch (error) {
      console.error('SMS sending error:', error);
      throw new Error('Failed to send SMS');
    }
  }

  /**
   * Format SMS message based on type
   */
  formatMessage(otp, type) {
    const appName = 'Medicine Inventory';
    
    switch (type) {
      case 'password_reset':
        return `Your ${appName} password reset code is: ${otp}. This code expires in 10 minutes. Do not share this code with anyone.`;
      case 'phone_verification':
        return `Your ${appName} verification code is: ${otp}. This code expires in 10 minutes.`;
      default:
        return `Your ${appName} verification code is: ${otp}. This code expires in 10 minutes.`;
    }
  }

  /**
   * Send SMS via Twilio
   */
  async sendViaTwilio(phoneNumber, message) {
    if (!this.twilioAccountSid || !this.twilioAuthToken || !this.twilioPhoneNumber) {
      throw new Error('Twilio credentials not configured');
    }

    const twilio = require('twilio')(this.twilioAccountSid, this.twilioAuthToken);
    
    const result = await twilio.messages.create({
      body: message,
      from: this.twilioPhoneNumber,
      to: phoneNumber
    });

    return {
      success: true,
      messageId: result.sid,
      provider: 'twilio'
    };
  }

  /**
   * Send SMS via TextBelt (Free SMS API)
   */
  async sendViaTextBelt(phoneNumber, message) {
    try {
      const response = await axios.post('https://textbelt.com/text', {
        phone: phoneNumber,
        message: message,
        key: this.textbeltApiKey
      });

      if (response.data.success) {
        return {
          success: true,
          messageId: response.data.textId,
          provider: 'textbelt'
        };
      } else {
        throw new Error(response.data.error || 'TextBelt API error');
      }
    } catch (error) {
      console.error('TextBelt error:', error.response?.data || error.message);
      // Fallback to console mode
      return await this.sendViaConsole(phoneNumber, message, message.match(/\d{6}/)?.[0] || '123456');
    }
  }

  /**
   * Send SMS via AWS SNS
   */
  async sendViaAWSSNS(phoneNumber, message) {
    const AWS = require('aws-sdk');
    const sns = new AWS.SNS({
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });

    const params = {
      Message: message,
      PhoneNumber: phoneNumber
    };

    const result = await sns.publish(params).promise();
    
    return {
      success: true,
      messageId: result.MessageId,
      provider: 'aws-sns'
    };
  }

  /**
   * Send SMS via console (for development)
   */
  async sendViaConsole(phoneNumber, message, otp) {
    console.log('\n' + '='.repeat(50));
    console.log('📱 SMS MESSAGE (Development Mode)');
    console.log('='.repeat(50));
    console.log(`To: ${phoneNumber}`);
    console.log(`Message: ${message}`);
    console.log(`OTP Code: ${otp}`);
    console.log('='.repeat(50) + '\n');

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      messageId: `console_${Date.now()}`,
      provider: 'console'
    };
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid length (10-15 digits)
    if (cleaned.length < 10 || cleaned.length > 15) {
      return false;
    }
    
    return true;
  }

  /**
   * Format phone number for international use
   */
  formatPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // If it starts with 1 and is 11 digits, it's likely US/Canada
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    // If it's 10 digits, assume US and add +1
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    // Otherwise, add + if not present
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  }
}

module.exports = new RealSMSService();
