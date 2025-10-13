# Contact Form Spam Protection

This document describes the comprehensive spam protection system implemented for the VerifiED contact form.

## 🛡️ Protection Features

### 1. Device Fingerprinting
- **Multi-factor device identification** combining:
  - Screen resolution and color depth
  - Timezone and language settings
  - Platform and user agent (truncated)
  - Canvas fingerprinting
  - Available fonts detection
  - Hardware concurrency and memory
  - WebGL renderer information
- **Fallback mechanism** for cases where fingerprinting fails
- **Privacy-focused** - no personally identifiable information stored

### 2. Rate Limiting
- **1 message per day per device** - prevents spam while allowing legitimate contact
- **Automatic blocking** after 3 attempts in 24 hours
- **24-hour cooldown period** for blocked devices
- **Graceful degradation** - system continues to work even if rate limiting fails

### 3. Email Validation
- **Real-time validation** with user feedback
- **Format verification** using regex patterns
- **Disposable email detection** - blocks common temporary email services
- **Visual feedback** with Bootstrap validation classes

### 4. User Experience Enhancements
- **Clear error messages** for rate limiting and validation
- **Informational notice** about daily limit
- **Disabled submit button** when validation fails
- **Extended timeout** for rate limit messages (8 seconds)

## 📊 Database Schema

### New Table: `contact_submissions`
```sql
CREATE TABLE `contact_submissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `device_fingerprint` varchar(255) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `email_hash` varchar(64) NOT NULL,
  `submission_count` int(11) DEFAULT 1,
  `last_submission` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `blocked_until` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `device_fingerprint` (`device_fingerprint`)
);
```

### Enhanced Table: `contact_messages`
Added columns for tracking:
- `device_fingerprint` - Links to rate limiting system
- `ip_address` - Additional tracking for analysis
- `user_agent` - Browser/device information

## 🚀 Implementation Files

### Frontend Components
- `src/utils/deviceFingerprint.js` - Device fingerprinting utility
- `src/components/home/HomePage.js` - Enhanced contact form with validation

### Backend Services
- `src/services/contactRateLimitService.js` - Rate limiting logic
- `src/routes/publicRoutes.js` - Enhanced contact endpoint
- `src/queries/adminQueries.js` - Database operations with tracking

### Database Updates
- `database_updates/contact_rate_limiting.sql` - Schema updates
- `database_updates/apply_contact_rate_limiting.js` - Migration script

## 🔧 Configuration

### Rate Limiting Settings
```javascript
const RATE_LIMIT_CONFIG = {
  maxSubmissionsPerDay: 1,        // Messages per day per device
  blockDurationHours: 24,         // How long to block after threshold
  suspiciousThreshold: 3,         // Block after N attempts
  cleanupIntervalDays: 7          // Clean old records after N days
};
```

### Disposable Email Domains
The system blocks common temporary email services:
- 10minutemail.com, tempmail.org, guerrillamail.com
- mailinator.com, yopmail.com, temp-mail.org
- throwaway.email, getnada.com

## 📈 Monitoring & Analytics

### Available Statistics
- Total unique devices tracked
- Currently blocked devices
- Active devices in last 24 hours
- Average submissions per device

### Admin Features
- View contact messages with device tracking
- Monitor submission patterns
- Identify potential spam sources

## 🛠️ Setup Instructions

1. **Apply Database Updates**:
   ```bash
   cd database_updates
   node apply_contact_rate_limiting.js
   ```

2. **Install Dependencies** (if needed):
   ```bash
   npm install mysql2
   ```

3. **Environment Variables**:
   No additional environment variables required - uses existing database configuration.

## 🔍 How It Works

### Submission Flow
1. **Device Fingerprint Generation** - Client generates unique device identifier
2. **Real-time Validation** - Email format and disposable domain checks
3. **Rate Limit Check** - Server verifies if device can submit
4. **Submission Recording** - Track attempt for future rate limiting
5. **Message Storage** - Store message with tracking information

### Rate Limiting Logic
1. Check if device has submitted in last 24 hours
2. If yes, check submission count against daily limit
3. If over limit or blocked, reject with appropriate message
4. If allowed, record submission and increment counter
5. Auto-block after suspicious threshold reached

## 🚨 Error Handling

### Graceful Degradation
- If fingerprinting fails → Use IP-based fallback
- If rate limiting fails → Allow submission but log error
- If database error → Show generic error message

### User-Friendly Messages
- **Rate Limited**: "Too many submissions. Please try again in X hours."
- **Invalid Email**: "Please enter a valid email address"
- **Disposable Email**: "Temporary email addresses are not allowed"

## 🔒 Security Considerations

### Privacy Protection
- Device fingerprints are hashed and non-reversible
- Email addresses are hashed for tracking (SHA-256)
- No personal data stored in rate limiting table
- User agent strings are truncated to prevent tracking abuse

### Attack Mitigation
- **Bot Protection**: Device fingerprinting makes automated attacks harder
- **IP Rotation**: Rate limiting by device, not just IP
- **Disposable Emails**: Blocks temporary email services
- **Brute Force**: Automatic blocking after threshold

## 📝 Maintenance

### Regular Tasks
- **Cleanup Old Records**: Run cleanup function weekly
- **Monitor Statistics**: Check for unusual patterns
- **Update Disposable Domains**: Add new temporary email services

### Performance Optimization
- Indexes on frequently queried columns
- Automatic cleanup of old records
- Efficient fingerprint generation

## 🎯 Benefits

1. **Effective Spam Prevention** - Multi-layered protection
2. **User-Friendly** - Clear feedback and reasonable limits
3. **Privacy-Focused** - No personal data collection
4. **Scalable** - Efficient database design
5. **Maintainable** - Clean code structure and documentation
6. **Resilient** - Graceful error handling and fallbacks

This implementation provides robust spam protection while maintaining a positive user experience for legitimate visitors.
