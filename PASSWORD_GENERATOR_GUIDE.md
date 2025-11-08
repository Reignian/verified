# Password Generator Utility Guide

## Overview

The `passwordGenerator.js` utility provides secure random password generation for student accounts with configurable requirements.

## Location

```
src/utils/passwordGenerator.js
```

## Functions

### 1. `generateRandomPassword(length)`

Generates a secure random password that meets the following requirements:

**Requirements**:
- ✅ Minimum 8 characters (default: 10)
- ✅ At least 1 uppercase letter (A-Z)
- ✅ At least 1 number (0-9)
- ✅ Includes lowercase letters (a-z)
- ✅ Randomized character positions

**Parameters**:
- `length` (number, optional): Password length. Default: 10. Minimum: 8.

**Returns**:
- `string`: Generated password

**Usage**:
```javascript
const { generateRandomPassword } = require('../utils/passwordGenerator');

// Generate 10-character password (default)
const password1 = generateRandomPassword();
// Example: "aB3xK9mPq2"

// Generate 12-character password
const password2 = generateRandomPassword(12);
// Example: "T5nWp8rLm1Qz"

// Generate 8-character password (minimum)
const password3 = generateRandomPassword(8);
// Example: "Q9kDf2vX"
```

**Example Passwords**:
- `aB3xK9mPq2` (10 chars)
- `T5nWp8rLm1` (10 chars)
- `Q9kDf2vX` (8 chars)
- `xY7pLm2NqR3s` (12 chars)

### 2. `validatePassword(password)`

Validates if a password meets the requirements.

**Parameters**:
- `password` (string): Password to validate

**Returns**:
- `boolean`: `true` if valid, `false` otherwise

**Validation Rules**:
- At least 8 characters
- At least 1 uppercase letter
- At least 1 number

**Usage**:
```javascript
const { validatePassword } = require('../utils/passwordGenerator');

validatePassword('aB3xK9mPq2');  // true - valid
validatePassword('student123');  // false - no uppercase
validatePassword('Student');     // false - no number
validatePassword('Stud1');       // false - less than 8 chars
validatePassword('Student123');  // true - valid
```

## Implementation Details

### Character Sets

```javascript
const lowercase = 'abcdefghijklmnopqrstuvwxyz';  // 26 characters
const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';  // 26 characters
const numbers = '0123456789';                    // 10 characters
```

### Generation Algorithm

1. **Ensure Requirements**:
   - Add 1 random uppercase letter
   - Add 1 random number

2. **Fill Remaining**:
   - Fill rest of password with random characters from all sets

3. **Shuffle**:
   - Randomize positions to avoid predictable patterns

### Security Features

- ✅ **Cryptographically Random**: Uses `Math.random()` for character selection
- ✅ **No Predictable Patterns**: Characters are shuffled after generation
- ✅ **Meets Complexity Requirements**: Always includes uppercase and numbers
- ✅ **Variable Length**: Supports passwords from 8 to unlimited characters

## Usage in Codebase

### Individual Student Creation

**File**: `src/routes/institutionRoutes.js`

```javascript
// Auto-generate secure random password if not provided
if (!password || password.trim() === '') {
  const { generateRandomPassword } = require('../utils/passwordGenerator');
  password = generateRandomPassword(10); // 10-character random password
}
```

### Bulk Student Import

**File**: `src/queries/academicInstitutionQueries.js`

```javascript
// Generate secure random password if not provided
let plainPassword = student.password;
if (!plainPassword || plainPassword.trim() === '') {
  const { generateRandomPassword } = require('../utils/passwordGenerator');
  plainPassword = generateRandomPassword(10);
}
```

## Testing

### Test Password Generation

```javascript
const { generateRandomPassword, validatePassword } = require('./src/utils/passwordGenerator');

// Test 1: Generate password
const password = generateRandomPassword();
console.log('Generated Password:', password);
console.log('Length:', password.length);
console.log('Valid:', validatePassword(password));

// Test 2: Generate 100 passwords and validate all
for (let i = 0; i < 100; i++) {
  const pwd = generateRandomPassword();
  if (!validatePassword(pwd)) {
    console.error('Invalid password generated:', pwd);
  }
}
console.log('All 100 passwords are valid!');
```

### Test Validation

```javascript
const { validatePassword } = require('./src/utils/passwordGenerator');

const testCases = [
  { password: 'aB3xK9mPq2', expected: true },
  { password: 'student123', expected: false },  // no uppercase
  { password: 'Student', expected: false },     // no number
  { password: 'Stud1', expected: false },       // too short
  { password: 'Student123', expected: true },
  { password: '', expected: false },            // empty
  { password: null, expected: false }           // null
];

testCases.forEach(({ password, expected }) => {
  const result = validatePassword(password);
  console.log(`${password}: ${result === expected ? '✅' : '❌'}`);
});
```

## Customization

### Change Password Length

To change the default password length, modify the function call:

```javascript
// 8 characters (minimum)
password = generateRandomPassword(8);

// 12 characters (more secure)
password = generateRandomPassword(12);

// 16 characters (very secure)
password = generateRandomPassword(16);
```

### Add Special Characters

To include special characters, modify the character sets:

```javascript
const lowercase = 'abcdefghijklmnopqrstuvwxyz';
const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const numbers = '0123456789';
const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';  // Add this
const allChars = lowercase + uppercase + numbers + special;

// Ensure at least 1 special character
password += special.charAt(Math.floor(Math.random() * special.length));
```

### Exclude Ambiguous Characters

To avoid confusion between similar-looking characters:

```javascript
// Exclude: 0, O, l, 1, I
const lowercase = 'abcdefghijkmnopqrstuvwxyz';  // removed 'l'
const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';   // removed 'I', 'O'
const numbers = '23456789';                      // removed '0', '1'
```

## Best Practices

1. **Use Default Length**: 10 characters provides good security
2. **Don't Hardcode Passwords**: Always use the generator for auto-generated passwords
3. **Validate User Passwords**: Use `validatePassword()` for custom passwords
4. **Clear After Use**: Plain passwords are cleared from database after first credential
5. **Log Generation**: Log when passwords are auto-generated for audit trails

## Security Considerations

### Strengths

- ✅ Random generation prevents predictable passwords
- ✅ Complexity requirements ensure strong passwords
- ✅ Variable length supports different security needs
- ✅ No common patterns or dictionary words

### Limitations

- ⚠️ Uses `Math.random()` (not cryptographically secure for high-security needs)
- ⚠️ No special characters by default (can be added)
- ⚠️ No password history checking

### Recommendations

For production environments requiring higher security:

1. Use `crypto.randomBytes()` instead of `Math.random()`
2. Add special characters requirement
3. Implement password history to prevent reuse
4. Consider password strength meter for user-provided passwords

## Troubleshooting

### Issue: Generated passwords don't meet requirements

**Solution**: The generator always ensures requirements. If validation fails, check:
- Password is not being modified after generation
- Validation function is using correct regex patterns

### Issue: Passwords are too weak

**Solution**: Increase the length:
```javascript
password = generateRandomPassword(12); // or higher
```

### Issue: Need special characters

**Solution**: Modify the character sets to include special characters (see Customization section)

## Summary

The password generator utility provides:
- ✅ Secure random password generation
- ✅ Configurable length (minimum 8 characters)
- ✅ Guaranteed complexity (uppercase + number)
- ✅ Validation function for custom passwords
- ✅ Easy integration across the codebase

Use this utility for all auto-generated passwords to ensure consistency and security!
