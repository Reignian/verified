// fileName: geminiService.js
// Gemini AI service for visual file analysis and comparison

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Get working Gemini vision model
 * @returns {Object} - Generative model instance
 */
function getModel() {
  // Use gemini-2.0-flash for image analysis (newest model, supports multimodal)
  // This model is available in v1beta API and works with free tier
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash'
    });
    console.log('✅ Gemini model initialized: gemini-2.0-flash');
    return model;
  } catch (error) {
    console.error('❌ Failed to initialize Gemini model:', error);
    console.error('Error details:', error.message);
    throw new Error('Gemini AI initialization failed. Please check your API key.');
  }
}

/**
 * Convert image or PDF file to base64 for Gemini API
 * Detects mime type from file content (magic bytes) if no extension
 * @param {string} filePath - Path to image or PDF file
 * @returns {Promise<Object>} - File data object for Gemini
 */
async function fileToGenerativePart(filePath) {
  const data = await fs.readFile(filePath);
  const base64Data = data.toString('base64');
  
  // Try to determine mime type from file extension first
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.pdf': 'application/pdf'
  };
  
  let mimeType = mimeTypes[ext];
  
  // If no extension, detect from file content (magic bytes)
  if (!mimeType) {
    const header = data.slice(0, 4).toString('hex');
    console.log('File header (magic bytes):', header);
    
    if (header.startsWith('25504446')) { // %PDF
      mimeType = 'application/pdf';
      console.log('✅ Detected as PDF from file content');
    } else if (header.startsWith('ffd8ff')) { // JPEG
      mimeType = 'image/jpeg';
      console.log('✅ Detected as JPEG from file content');
    } else if (header.startsWith('89504e47')) { // PNG
      mimeType = 'image/png';
      console.log('✅ Detected as PNG from file content');
    } else if (header.startsWith('47494638')) { // GIF
      mimeType = 'image/gif';
      console.log('✅ Detected as GIF from file content');
    } else {
      // Default to PDF (most common for credentials)
      mimeType = 'application/pdf';
      console.log('⚠️  Unknown file type, defaulting to PDF');
    }
  }
  
  console.log('Using mime type:', mimeType);
  
  return {
    inlineData: {
      data: base64Data,
      mimeType: mimeType
    }
  };
}

/**
 * Analyze credential type using Gemini Vision
 * @param {string} filePath - Path to credential image
 * @returns {Promise<Object>} - Analysis result
 */
async function analyzeCredentialType(filePath) {
  try {
    console.log('🔍 Analyzing credential type with Gemini AI:', filePath);
    console.log('API Key present:', !!process.env.GEMINI_API_KEY);
    console.log('API Key length:', process.env.GEMINI_API_KEY?.length);
    
    const model = getModel();
    const imagePart = await fileToGenerativePart(filePath);
    
    const prompt = `You are an expert at identifying educational credentials. Analyze this image and identify the document type.

IMPORTANT - Document Type Categories (in priority order):
- "Transcript" or "Transcript of Records": Grade sheets, academic records, lists of courses and grades
- "Certificate of Graduation": Documents titled "Certificate of Graduation" or "Graduation Certificate" - these certify completion and may mention a degree name BUT the main purpose is to certify graduation
- "Bachelor Degree": Formal degree certificates (NOT graduation certificates) that confer Bachelor's degree
- "Master Degree": Formal degree certificates (NOT graduation certificates) that confer Master's degree
- "PhD Degree": Formal degree certificates (NOT graduation certificates) that confer Doctoral degree
- "Diploma": Professional diplomas, vocational certificates
- "Certificate": Achievement certificates, participation certificates
- "Achievement Award": Awards, honors, recognitions
- "Letter of Recommendation": Reference letters
- "Other": If none of the above

CRITICAL DISTINCTION:
- "Certificate of Graduation": If the document title says "CERTIFICATE OF GRADUATION" or "GRADUATION CERTIFICATE", classify as "Certificate of Graduation" even if it mentions "Bachelor", "Master", or "PhD" in the content. The title takes priority.
- "Bachelor/Master/PhD Degree": Only if the document title says "Degree", "Diploma", or is formally conferring the degree without the word "Certificate" in the title.

KEY IDENTIFIERS:
- Transcripts: Tables/lists of courses, grades, GPA, multiple semesters
- Certificate of Graduation: Title contains "Certificate of Graduation", may list degree completed, certifies graduation ceremony
- Degrees: Title says "Degree" or formal conferment without "Certificate" in title, "conferred", "granted"
- Certificates: Simple certificates, "certify that", participation/achievement

Analyze carefully and respond in JSON format:
{
  "documentType": "exact type from list above",
  "confidence": "High/Medium/Low",
  "institutionName": "name or null",
  "recipientName": "name or null", 
  "issueDate": "date or null",
  "visualElements": {
    "hasOfficialSeal": true/false,
    "hasSignature": true/false,
    "hasStamp": true/false,
    "hasLogo": true/false,
    "hasGradeTable": true/false,
    "hasCourseList": true/false,
    "sealDescription": "description or null",
    "signatureDescription": "description or null"
  },
  "isCredential": true/false,
  "documentPurpose": "what this document certifies/shows",
  "notes": "key visual features that helped identify the type"
}`;

    console.log('📤 Sending request to Gemini API...');
    const result = await model.generateContent([prompt, imagePart]);
    console.log('📥 Received response from Gemini API');
    const response = await result.response;
    const text = response.text();
    console.log('Response text length:', text.length);
    
    // Extract JSON from response (might have markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      console.log('Gemini analysis completed:', analysis.documentType);
      return {
        success: true,
        analysis
      };
    }
    
    throw new Error('Failed to parse Gemini response');
    
  } catch (error) {
    console.error('❌ Gemini analysis error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.response) {
      console.error('API Response:', error.response);
    }
    return {
      success: false,
      error: error.message,
      analysis: null
    };
  }
}

/**
 * Compare two credential images using Gemini Vision
 * @param {string} verifiedFilePath - Path to verified credential
 * @param {string} uploadedFilePath - Path to uploaded credential
 * @returns {Promise<Object>} - Comparison result
 */
async function compareCredentialImages(verifiedFilePath, uploadedFilePath) {
  try {
    console.log('🔍 Comparing credentials with Gemini AI...');
    console.log('Verified file:', verifiedFilePath);
    console.log('Uploaded file:', uploadedFilePath);
    
    const model = getModel();
    const verifiedImage = await fileToGenerativePart(verifiedFilePath);
    const uploadedImage = await fileToGenerativePart(uploadedFilePath);
    
    const prompt = `You are an expert fraud detection AI specializing in educational credential verification. 

YOUR TASK: Visually compare these two credential documents and detect any signs of tampering, fraud, or forgery.

📄 DOCUMENT 1: VERIFIED/OFFICIAL credential from the institution's system (SOURCE OF TRUTH)
📄 DOCUMENT 2: USER-SUBMITTED credential (NEEDS VALIDATION)

🔍 ANALYSIS INSTRUCTIONS:

1. CREDENTIAL TYPE IDENTIFICATION:
   - Describe what type of credential Document 1 is (Transcript, Degree, Certificate, etc.)
   - Describe what type of credential Document 2 is
   - Are they the SAME type? (Both transcripts, both degrees, etc.)
   - Look at visual structure: grade tables = transcript, formal certificate = degree

2. VISUAL COMPARISON - Check if they are the EXACT SAME document:
   - Same recipient/student name?
   - Same institution name?
   - Same dates/academic period?
   - Same grades/content (if transcript)?
   - Same degree program (if degree)?
   - Identical layout and formatting?

3. FRAUD DETECTION - Look for signs of tampering in Document 2:
   ⚠️ TEXT MANIPULATION:
   - Changed names, grades, dates, or other text
   - Inconsistent fonts or font sizes
   - Text overlay or digital editing
   - Blurred or pixelated text areas
   
   ⚠️ VISUAL FORGERY:
   - Modified or fake official seals
   - Forged or altered signatures
   - Added or removed stamps
   - Changed or fake logos
   - Inconsistent image quality in different areas
   
   ⚠️ DIGITAL TAMPERING:
   - Photo editing artifacts
   - Clone stamp tool marks
   - Misaligned elements
   - Color inconsistencies
   - Resolution differences in parts of the document

4. AUTHENTICITY MARKERS COMPARISON:
   - Official seal: Does Document 2's seal match Document 1's exactly?
   - Signature: Does Document 2's signature match Document 1's exactly?
   - Stamps: Do stamps match exactly?
   - Logo: Does the institution logo match exactly?
   - Security features: Watermarks, holograms, serial numbers

5. FINAL ASSESSMENT:
   - If documents are IDENTICAL → "Authentic"
   - If minor differences that could be legitimate → "Suspicious" 
   - If clear signs of tampering/forgery → "Fraudulent"

Respond in JSON format:
{
  "sameCredentialType": true/false,
  "verifiedType": "type from first image",
  "uploadedType": "type from second image",
  "exactSameDocument": true/false,
  "matchConfidence": "High/Medium/Low",
  "visualDifferences": {
    "textChanges": ["list of text differences"],
    "sealDifferences": "description or none",
    "signatureDifferences": "description or none",
    "logoDifferences": "description or none",
    "layoutChanges": "description or none",
    "otherDifferences": ["other differences"]
  },
  "authenticityMarkers": {
    "sealMatch": true/false,
    "signatureMatch": true/false,
    "stampMatch": true/false,
    "logoMatch": true/false,
    "overallAuthenticityScore": 0-100
  },
  "tamperingIndicators": {
    "detected": true/false,
    "signs": ["list of tampering signs"],
    "severity": "None/Minor/Moderate/Severe"
  },
  "recommendation": "Authentic/Suspicious/Fraudulent",
  "detailedAnalysis": "comprehensive explanation of findings"
}`;

    const result = await model.generateContent([
      prompt,
      verifiedImage,
      uploadedImage
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const comparison = JSON.parse(jsonMatch[0]);
      console.log('Gemini comparison completed');
      return {
        success: true,
        comparison
      };
    }
    
    throw new Error('Failed to parse Gemini comparison response');
    
  } catch (error) {
    console.error('❌ Gemini comparison error:', error);
    console.error('Error details:', error.message);
    
    // Check if it's a quota/rate limit error
    let userMessage = error.message;
    let quotaExhausted = false;
    
    if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')) {
      userMessage = 'Gemini AI free tier quota exhausted. Comparison will continue using OCR-only mode.';
      quotaExhausted = true;
      console.log('⚠️  Gemini API quota exhausted - falling back to OCR-only');
    } else if (error.message.includes('403') || error.message.includes('API_KEY_INVALID')) {
      userMessage = 'Gemini API key is invalid or expired.';
      console.log('⚠️  Invalid Gemini API key');
    } else if (error.message.includes('500') || error.message.includes('503')) {
      userMessage = 'Gemini API is temporarily unavailable. Using OCR-only mode.';
      console.log('⚠️  Gemini API service unavailable');
    }
    
    return {
      success: false,
      error: userMessage,
      quotaExhausted: quotaExhausted,
      comparison: null
    };
  }
}

/**
 * Detect authenticity markers in credential
 * @param {string} filePath - Path to credential image
 * @returns {Promise<Object>} - Authenticity markers analysis
 */
async function detectAuthenticityMarkers(filePath) {
  try {
    console.log('Detecting authenticity markers with Gemini AI...');
    
    const model = getModel();
    const imagePart = await fileToGenerativePart(filePath);
    
    const prompt = `Analyze this credential document for authenticity markers and security features.

Please identify and describe:
1. Official Seals: Location, appearance, quality
2. Signatures: Number, position, clarity
3. Stamps: Type, color, placement
4. Watermarks: Visible or not
5. Holograms: Present or not
6. Security Threads: Visible or not
7. Embossing: Present or not
8. Serial Numbers: Visible or not
9. QR Codes/Barcodes: Present or not
10. Professional Quality: Print quality, paper texture indicators

Respond in JSON format:
{
  "officialSeal": {
    "present": true/false,
    "count": number,
    "description": "detailed description",
    "quality": "High/Medium/Low",
    "position": "location on document"
  },
  "signatures": {
    "present": true/false,
    "count": number,
    "description": "description of each signature",
    "quality": "High/Medium/Low"
  },
  "stamps": {
    "present": true/false,
    "count": number,
    "description": "description",
    "color": "color description"
  },
  "watermarks": {
    "present": true/false,
    "description": "description or null"
  },
  "holograms": {
    "present": true/false,
    "description": "description or null"
  },
  "securityFeatures": {
    "securityThreads": true/false,
    "embossing": true/false,
    "serialNumber": true/false,
    "qrCode": true/false,
    "barcode": true/false
  },
  "professionalQuality": {
    "printQuality": "High/Medium/Low",
    "appearsProfessional": true/false,
    "notes": "observations"
  },
  "overallAuthenticityScore": 0-100,
  "concerns": ["list any authenticity concerns"]
}`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const markers = JSON.parse(jsonMatch[0]);
      console.log('Authenticity markers detected');
      return {
        success: true,
        markers
      };
    }
    
    throw new Error('Failed to parse Gemini markers response');
    
  } catch (error) {
    console.error('Gemini markers detection error:', error);
    
    // Check if it's a quota/rate limit error
    let userMessage = error.message;
    let quotaExhausted = false;
    
    if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')) {
      userMessage = 'Gemini AI free tier quota exhausted. Markers detection will continue using OCR-only mode.';
      quotaExhausted = true;
      console.log('⚠️  Gemini API quota exhausted - falling back to OCR-only');
    } else if (error.message.includes('403') || error.message.includes('API_KEY_INVALID')) {
      userMessage = 'Gemini API key is invalid or expired.';
      console.log('⚠️  Invalid Gemini API key');
    } else if (error.message.includes('500') || error.message.includes('503')) {
      userMessage = 'Gemini API is temporarily unavailable. Using OCR-only mode.';
      console.log('⚠️  Gemini API service unavailable');
    }
    
    return {
      success: false,
      error: userMessage,
      quotaExhausted: quotaExhausted,
      markers: null
    };
  }
}

module.exports = {
  analyzeCredentialType,
  compareCredentialImages,
  detectAuthenticityMarkers
};
