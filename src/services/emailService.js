// fileName: emailService.js
// Email service for generating Gmail compose URLs for signup notifications
// Uses the admin's configured reply email from System Settings

const SystemSettingsService = require('./systemSettingsService');

// Generate Gmail compose URL for approval email
const generateApprovalEmailUrl = async (recipientEmail, institutionName, username) => {
  try {
    const replyEmail = await SystemSettingsService.getSetting('reply_email') || 'support@verified.com';
    const systemName = await SystemSettingsService.getSetting('system_name') || 'VerifiED';
    const signature = await SystemSettingsService.getSetting('reply_signature') || 'Best regards,\nThe VerifiED Team';
    
    const subject = `🎉 Your ${systemName} Institution Account Has Been Approved!`;
    const body = `Dear ${institutionName},

Great news! Your institution account has been approved by our administrator.

Your Login Credentials:
━━━━━━━━━━━━━━━━━━━━
Username: ${username}
Email: ${recipientEmail}
Login URL: ${process.env.APP_URL || 'http://localhost:3000'}/login

You can now login and start using ${systemName} to issue blockchain-verified credentials to your students.

Next Steps:
1. Login to your account using your username and password
2. Add your MetaMask public address (you'll be prompted)
3. Complete your institution profile
4. Add academic programs
5. Start issuing credentials

If you have any questions or need assistance, please don't hesitate to reply to this email.

${signature}`;
    
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    const encodedTo = encodeURIComponent(recipientEmail);
    const encodedFrom = encodeURIComponent(replyEmail);
    
    // Gmail compose URL
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedTo}&su=${encodedSubject}&body=${encodedBody}&from=${encodedFrom}`;
    
    return { success: true, gmailUrl };
  } catch (error) {
    console.error('Error generating approval email URL:', error);
    return { success: false, error: error.message };
  }
};

// Generate Gmail compose URL for rejection email
const generateRejectionEmailUrl = async (recipientEmail, institutionName, username) => {
  try {
    const replyEmail = await SystemSettingsService.getSetting('reply_email') || 'support@verified.com';
    const systemName = await SystemSettingsService.getSetting('system_name') || 'VerifiED';
    const signature = await SystemSettingsService.getSetting('reply_signature') || 'Best regards,\nThe VerifiED Team';
    
    const subject = `Your ${systemName} Institution Account Request`;
    const body = `Dear ${institutionName},

Thank you for your interest in ${systemName}.

Account Request Status:
━━━━━━━━━━━━━━━━━━━━
Unfortunately, we are unable to approve your institution account request at this time.

This decision may be due to one of the following reasons:
• Incomplete or insufficient information provided
• Unable to verify institution legitimacy
• Duplicate account request
• Institution not eligible for the platform

What You Can Do:
If you believe this decision was made in error or if you have additional information to provide, please reply to this email for further assistance.

We appreciate your understanding.

${signature}`;
    
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    const encodedTo = encodeURIComponent(recipientEmail);
    const encodedFrom = encodeURIComponent(replyEmail);
    
    // Gmail compose URL
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedTo}&su=${encodedSubject}&body=${encodedBody}&from=${encodedFrom}`;
    
    return { success: true, gmailUrl };
  } catch (error) {
    console.error('Error generating rejection email URL:', error);
    return { success: false, error: error.message };
  }
};

// Generate Gmail compose URL for credential issuance notification
const generateCredentialIssuanceEmailUrl = async (studentEmail, credentialType, studentUsername, studentPassword, isNewAccount) => {
  try {
    const replyEmail = await SystemSettingsService.getSetting('reply_email') || 'support@verified.com';
    const systemName = await SystemSettingsService.getSetting('system_name') || 'VerifiED';
    const signature = await SystemSettingsService.getSetting('reply_signature') || 'Best regards,\nThe VerifiED Team';
    
    let subject, body;
    
    if (credentialType === 'Account' && isNewAccount && studentPassword) {
      // Welcome email for new student account
      subject = `🎓 Welcome to ${systemName} - Your Account Has Been Created`;
      body = `Dear Student,

Welcome to ${systemName}! Your student account has been successfully created.

Your Account Credentials:
━━━━━━━━━━━━━━━━━━━━
Email: ${studentEmail}
Username: ${studentUsername}
Password: ${studentPassword}

Login URL: ${process.env.APP_URL || 'http://localhost:3000'}/login

⚠️ IMPORTANT: Please change your password immediately after your first login for security purposes.

What You Can Do:
1. Login to your ${systemName} account using the credentials above
2. Update your password in the settings
3. View your profile and account information
4. Access your credentials once they are issued by your institution

Your account is now ready to receive blockchain-verified credentials from your institution.

If you have any questions or need assistance, please don't hesitate to reply to this email.

${signature}`;
    } else {
      // Credential issuance notification
      subject = `🎓 Your ${credentialType} Has Been Issued - ${systemName}`;
      
      let credentialsSection = '';
      if (isNewAccount && studentPassword) {
        credentialsSection = `
Your Account Credentials:
━━━━━━━━━━━━━━━━━━━━
Email: ${studentEmail}
Username: ${studentUsername}
Password: ${studentPassword}

⚠️ IMPORTANT: Please change your password immediately after your first login for security purposes.
`;
      } else {
        credentialsSection = `
Your Account Information:
━━━━━━━━━━━━━━━━━━━━
Email: ${studentEmail}
Username: ${studentUsername}
`;
      }
      
      body = `Dear Student,

Great news! Your ${credentialType} has been successfully issued and is now available in your ${systemName} account.

${credentialsSection}
Login URL: ${process.env.APP_URL || 'http://localhost:3000'}/login

What You Can Do:
1. Login to your ${systemName} account using your credentials
2. View your blockchain-verified credential
3. Download or share your credential securely
4. Access your credential anytime, anywhere

Your credential is secured on the blockchain and can be verified by anyone using the ${systemName} verification system.

If you have any questions or need assistance, please don't hesitate to reply to this email.

${signature}`;
    }
    
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    const encodedTo = encodeURIComponent(studentEmail);
    const encodedFrom = encodeURIComponent(replyEmail);
    
    // Gmail compose URL
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedTo}&su=${encodedSubject}&body=${encodedBody}&from=${encodedFrom}`;
    
    return { success: true, gmailUrl };
  } catch (error) {
    console.error('Error generating credential issuance email URL:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateApprovalEmailUrl,
  generateRejectionEmailUrl,
  generateCredentialIssuanceEmailUrl
};
