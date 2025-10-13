// fileName: deviceFingerprint.js
// Device fingerprinting utility for spam protection

export const generateDeviceFingerprint = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('Device fingerprint', 2, 2);
  
  // Access screen object safely
  const screenInfo = window.screen || {};
  
  const fingerprint = {
    // Screen characteristics
    screen: `${screenInfo.width || 0}x${screenInfo.height || 0}x${screenInfo.colorDepth || 0}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    userAgent: navigator.userAgent.substring(0, 100), // Truncated for storage
    
    // Canvas fingerprint (truncated)
    canvas: canvas.toDataURL().substring(0, 50),
    
    // Available fonts (simplified detection)
    fonts: detectFonts(),
    
    // Hardware info
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: navigator.deviceMemory || 0,
    
    // WebGL info (if available)
    webgl: getWebGLInfo()
  };
  
  // Create hash of combined fingerprint
  return hashFingerprint(JSON.stringify(fingerprint));
};

const detectFonts = () => {
  const testFonts = ['Arial', 'Times', 'Courier', 'Helvetica', 'Georgia'];
  const availableFonts = [];
  
  testFonts.forEach(font => {
    if (isFontAvailable(font)) {
      availableFonts.push(font);
    }
  });
  
  return availableFonts.join(',');
};

const isFontAvailable = (fontName) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  const text = 'abcdefghijklmnopqrstuvwxyz0123456789';
  context.font = '72px monospace';
  const baselineSize = context.measureText(text).width;
  
  context.font = `72px ${fontName}, monospace`;
  const newSize = context.measureText(text).width;
  
  return newSize !== baselineSize;
};

const getWebGLInfo = () => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return 'none';
    
    const renderer = gl.getParameter(gl.RENDERER);
    const vendor = gl.getParameter(gl.VENDOR);
    
    return `${vendor}-${renderer}`.substring(0, 50);
  } catch (e) {
    return 'error';
  }
};

const hashFingerprint = (str) => {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
};

// Additional validation helpers
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isDisposableEmail = (email) => {
  // Common disposable email domains
  const disposableDomains = [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 
    'mailinator.com', 'yopmail.com', 'temp-mail.org',
    'throwaway.email', 'getnada.com'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  return disposableDomains.includes(domain);
};
