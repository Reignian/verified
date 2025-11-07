// fileName: smtpEmailService.js
// SMTP Email service for automated email sending using nodemailer

const nodemailer = require('nodemailer');
const SystemSettingsService = require('./systemSettingsService');

// Create reusable transporter with timeout and connection pooling
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Connection timeout settings (critical for Railway hosting)
    connectionTimeout: 10000, // 10 seconds to establish connection
    greetingTimeout: 10000,   // 10 seconds to wait for greeting
    socketTimeout: 30000,      // 30 seconds for socket inactivity
    // Connection pooling for better performance
    pool: true,
    maxConnections: 5,
    maxMessages: 10,
    // Retry settings
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates if needed
      minVersion: 'TLSv1.2'
    },
    // Debug logging (set to true if you need to troubleshoot)
    debug: process.env.NODE_ENV !== 'production',
    logger: process.env.NODE_ENV !== 'production'
  });
};

// Send welcome email to new student account
const sendWelcomeEmail = async (studentEmail, studentName, username, password) => {
  try {
    const systemName = await SystemSettingsService.getSetting('system_name') || 'VerifiED';
    const replyEmail = await SystemSettingsService.getSetting('reply_email') || process.env.EMAIL_USER;
    const signature = await SystemSettingsService.getSetting('reply_signature') || 'Best regards,\nThe VerifiED Team';
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || `${systemName} <noreply@verified.com>`,
      to: studentEmail,
      replyTo: replyEmail,
      subject: `🎓 Welcome to ${systemName} - Your Account Has Been Created`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a73e8;">Welcome to ${systemName}!</h2>
          
          <p>Dear ${studentName},</p>
          
          <p>Your student account has been successfully created.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Your Account Credentials:</h3>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${studentEmail}</p>
            <p style="margin: 5px 0;"><strong>Username:</strong> ${username}</p>
            <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
          </div>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>⚠️ IMPORTANT:</strong> Please change your password immediately after your first login for security purposes.</p>
          </div>
          
          <p><strong>Login URL:</strong> <a href="${process.env.APP_URL || 'http://localhost:3000'}/login" style="color: #1a73e8;">${process.env.APP_URL || 'http://localhost:3000'}/login</a></p>
          
          <h3 style="color: #333;">What You Can Do:</h3>
          <ol>
            <li>Login to your ${systemName} account using the credentials above</li>
            <li>Update your password in the settings</li>
            <li>View your profile and account information</li>
            <li>Access your credentials once they are issued by your institution</li>
          </ol>
          
          <p>Your account is now ready to receive blockchain-verified credentials from your institution.</p>
          
          <p>If you have any questions or need assistance, please don't hesitate to reply to this email.</p>
          
          <p style="white-space: pre-line; margin-top: 30px; color: #666;">${signature}</p>
        </div>
      `,
      text: `
Welcome to ${systemName}!

Dear ${studentName},

Your student account has been successfully created.

Your Account Credentials:
━━━━━━━━━━━━━━━━━━━━
Email: ${studentEmail}
Username: ${username}
Password: ${password}

Login URL: ${process.env.APP_URL || 'http://localhost:3000'}/login

⚠️ IMPORTANT: Please change your password immediately after your first login for security purposes.

What You Can Do:
1. Login to your ${systemName} account using the credentials above
2. Update your password in the settings
3. View your profile and account information
4. Access your credentials once they are issued by your institution

Your account is now ready to receive blockchain-verified credentials from your institution.

If you have any questions or need assistance, please don't hesitate to reply to this email.

${signature}
      `
    };
    
    // Add timeout wrapper for sendMail operation
    const sendMailWithTimeout = (transporter, mailOptions, timeout = 45000) => {
      return Promise.race([
        transporter.sendMail(mailOptions),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email send operation timed out')), timeout)
        )
      ]);
    };
    
    const info = await sendMailWithTimeout(transporter, mailOptions);
    
    console.log('[SUCCESS] Welcome email sent successfully!');
    console.log(`   To: ${studentEmail}`);
    console.log(`   Subject: Welcome to ${systemName}`);
    console.log(`   Message ID: ${info.messageId}`);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[ERROR] Failed to send welcome email:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error command:', error.command);
    
    // Provide more specific error information
    let errorDetail = error.message;
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      errorDetail = 'Connection timeout - SMTP server took too long to respond. This may be due to network restrictions or Gmail rate limiting.';
    } else if (error.code === 'ECONNREFUSED') {
      errorDetail = 'Connection refused - Unable to connect to SMTP server. Check EMAIL_HOST and EMAIL_PORT settings.';
    } else if (error.code === 'EAUTH') {
      errorDetail = 'Authentication failed - Check EMAIL_USER and EMAIL_PASS credentials.';
    }
    
    return { success: false, error: errorDetail, errorCode: error.code };
  }
};

// Send credential issuance notification email
const sendCredentialIssuanceEmail = async (studentEmail, studentName, username, credentialType, isNewAccount = false, password = null) => {
  try {
    const systemName = await SystemSettingsService.getSetting('system_name') || 'VerifiED';
    const replyEmail = await SystemSettingsService.getSetting('reply_email') || process.env.EMAIL_USER;
    const signature = await SystemSettingsService.getSetting('reply_signature') || 'Best regards,\nThe VerifiED Team';
    
    const transporter = createTransporter();
    
    // Build credentials section based on whether it's a new account
    let credentialsHtml = '';
    let credentialsText = '';
    
    if (isNewAccount && password) {
      // First credential WITH password available
      credentialsHtml = `
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Your Account Credentials:</h3>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${studentEmail}</p>
          <p style="margin: 5px 0;"><strong>Username:</strong> ${username}</p>
          <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
        </div>
        
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>⚠️ IMPORTANT:</strong> Please change your password immediately after your first login for security purposes.</p>
        </div>
      `;
      
      credentialsText = `
Your Account Credentials:
━━━━━━━━━━━━━━━━━━━━
Email: ${studentEmail}
Username: ${username}
Password: ${password}

⚠️ IMPORTANT: Please change your password immediately after your first login for security purposes.
      `;
    } else if (isNewAccount && !password) {
      // First credential WITHOUT password (password was sent in welcome email)
      credentialsHtml = `
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Your Account Information:</h3>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${studentEmail}</p>
          <p style="margin: 5px 0;"><strong>Username:</strong> ${username}</p>
        </div>
        
        <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>ℹ️ Note:</strong> Your password was sent to you in a previous welcome email when your account was created. Please check your inbox for the email with subject "Welcome to ${systemName}".</p>
          <p style="margin: 10px 0 0 0;"><strong>Can't find it?</strong> Contact your institution to reset your password.</p>
        </div>
      `;
      
      credentialsText = `
Your Account Information:
━━━━━━━━━━━━━━━━━━━━
Email: ${studentEmail}
Username: ${username}

ℹ️ Note: Your password was sent to you in a previous welcome email when your account was created. Please check your inbox for the email with subject "Welcome to ${systemName}".

Can't find it? Contact your institution to reset your password.
      `;
    } else {
      // Subsequent credentials (not first credential)
      credentialsHtml = `
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Your Account Information:</h3>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${studentEmail}</p>
          <p style="margin: 5px 0;"><strong>Username:</strong> ${username}</p>
        </div>
      `;
      
      credentialsText = `
Your Account Information:
━━━━━━━━━━━━━━━━━━━━
Email: ${studentEmail}
Username: ${username}
      `;
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || `${systemName} <noreply@verified.com>`,
      to: studentEmail,
      replyTo: replyEmail,
      subject: `🎓 Your ${credentialType} Has Been Issued - ${systemName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a73e8;">Great News!</h2>
          
          <p>Dear ${studentName},</p>
          
          <p>Your <strong>${credentialType}</strong> has been successfully issued and is now available in your ${systemName} account.</p>
          
          ${credentialsHtml}
          
          <p><strong>Login URL:</strong> <a href="${process.env.APP_URL || 'http://localhost:3000'}/login" style="color: #1a73e8;">${process.env.APP_URL || 'http://localhost:3000'}/login</a></p>
          
          <h3 style="color: #333;">What You Can Do:</h3>
          <ol>
            <li>Login to your ${systemName} account using your credentials</li>
            <li>View your blockchain-verified credential</li>
            <li>Download or share your credential securely</li>
            <li>Access your credential anytime, anywhere</li>
          </ol>
          
          <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;">Your credential is secured on the blockchain and can be verified by anyone using the ${systemName} verification system.</p>
          </div>
          
          <p>If you have any questions or need assistance, please don't hesitate to reply to this email.</p>
          
          <p style="white-space: pre-line; margin-top: 30px; color: #666;">${signature}</p>
        </div>
      `,
      text: `
Great News!

Dear ${studentName},

Your ${credentialType} has been successfully issued and is now available in your ${systemName} account.

${credentialsText}

Login URL: ${process.env.APP_URL || 'http://localhost:3000'}/login

What You Can Do:
1. Login to your ${systemName} account using your credentials
2. View your blockchain-verified credential
3. Download or share your credential securely
4. Access your credential anytime, anywhere

Your credential is secured on the blockchain and can be verified by anyone using the ${systemName} verification system.

If you have any questions or need assistance, please don't hesitate to reply to this email.

${signature}
      `
    };
    
    // Add timeout wrapper for sendMail operation
    const sendMailWithTimeout = (transporter, mailOptions, timeout = 45000) => {
      return Promise.race([
        transporter.sendMail(mailOptions),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email send operation timed out')), timeout)
        )
      ]);
    };
    
    const info = await sendMailWithTimeout(transporter, mailOptions);
    
    console.log('[SUCCESS] Credential notification email sent successfully!');
    console.log(`   To: ${studentEmail}`);
    console.log(`   Subject: ${credentialType} Issued`);
    console.log(`   First Credential: ${isNewAccount ? 'Yes' : 'No'}`);
    console.log(`   Password Included: ${isNewAccount && password ? 'Yes' : 'No'}`);
    console.log(`   Message ID: ${info.messageId}`);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[ERROR] Failed to send credential notification email:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error command:', error.command);
    
    // Provide more specific error information
    let errorDetail = error.message;
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      errorDetail = 'Connection timeout - SMTP server took too long to respond. This may be due to network restrictions or Gmail rate limiting.';
    } else if (error.code === 'ECONNREFUSED') {
      errorDetail = 'Connection refused - Unable to connect to SMTP server. Check EMAIL_HOST and EMAIL_PORT settings.';
    } else if (error.code === 'EAUTH') {
      errorDetail = 'Authentication failed - Check EMAIL_USER and EMAIL_PASS credentials.';
    }
    
    return { success: false, error: errorDetail, errorCode: error.code };
  }
};

// Test email configuration
const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('[SUCCESS] SMTP server is ready to send emails');
    return { success: true, message: 'SMTP configuration is valid' };
  } catch (error) {
    console.error('[ERROR] SMTP configuration error:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendCredentialIssuanceEmail,
  testEmailConfiguration
};
