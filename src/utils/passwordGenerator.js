// fileName: passwordGenerator.js
// Utility function to generate secure random passwords

/**
 * Generate a random password with the following requirements:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 * 
 * @param {number} length - Password length (default: 10)
 * @returns {string} - Generated password
 */
const generateRandomPassword = (length = 10) => {
  // Ensure minimum length of 8
  if (length < 8) {
    length = 8;
  }

  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const allChars = lowercase + uppercase + numbers;

  let password = '';

  // Ensure at least 1 uppercase letter
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));

  // Ensure at least 1 number
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));

  // Fill the rest with random characters from all sets
  for (let i = password.length; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle the password to randomize positions of required characters
  password = password.split('').sort(() => Math.random() - 0.5).join('');

  return password;
};

/**
 * Validate if a password meets the requirements
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 * 
 * @param {string} password - Password to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return false;
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return hasUppercase && hasNumber;
};

module.exports = {
  generateRandomPassword,
  validatePassword
};
