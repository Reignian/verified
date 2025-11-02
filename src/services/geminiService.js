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
  // Use gemini-pro-vision for image analysis
  // This is the stable vision model available for most API keys
  try {
    return genAI.getGenerativeModel({ 
      model: 'gemini-pro-vision',
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.4,
      }
    });
  } catch (error) {
    console.error('Failed to initialize Gemini model:', error);
    throw new Error('Gemini AI initialization failed. Please check your API key.');
  }
}

/**
 * Convert image or PDF file to base64 for Gemini API
 * @param {string} filePath - Path to image or PDF file
 * @returns {Promise<Object>} - File data object for Gemini
 */
async function fileToGenerativePart(filePath) {
  const data = await fs.readFile(filePath);
  const base64Data = data.toString('base64');
  
  // Determine mime type from file extension
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
  
  return {
    inlineData: {
      data: base64Data,
      mimeType: mimeTypes[ext] || 'image/jpeg'
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
    console.log('Analyzing credential type with Gemini AI:', filePath);
    
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

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
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
    console.error('Gemini analysis error:', error);
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
    console.log('Comparing credentials with Gemini AI...');
    
    const model = getModel();
    const verifiedImage = await fileToGenerativePart(verifiedFilePath);
    const uploadedImage = await fileToGenerativePart(uploadedFilePath);
    
    const prompt = `You are an expert at comparing educational credentials. Compare these two documents visually.

CRITICAL: Determine document type by VISUAL ANALYSIS, not just text labels:
- Transcripts: Have tables/lists of courses, grades, multiple semesters, GPA calculations
- Degrees: Single certificate page, decorative borders, "conferred" or "granted", formal design
- Certificates: Simpler design, "certify that", completion statements

Image 1: VERIFIED/OFFICIAL credential (source of truth)
Image 2: USER-SUBMITTED credential (to be validated)

ANALYZE CAREFULLY:

1. DOCUMENT TYPE IDENTIFICATION (Visual Analysis):
   - What type is Image 1? Look at layout, structure, content format
   - What type is Image 2? Look at layout, structure, content format
   - Are they the SAME type of document? (Same purpose and structure)
   
   IMPORTANT: If both look like the same type visually (e.g., both have grade tables = both transcripts, 
   or both are formal certificates = both degrees), mark as SAME TYPE even if OCR might misread labels.

2. EXACT DOCUMENT MATCH:
   - Same person/recipient?
   - Same institution?
   - Same date/period?
   - Same content?

3. VISUAL DIFFERENCES:
   - Text content changes
   - Seal/stamp differences
   - Signature differences
   - Logo differences
   - Layout/format changes
   - Color/quality differences

4. AUTHENTICITY MARKERS:
   - Compare seals (identical?)
   - Compare signatures (identical?)
   - Compare stamps (identical?)
   - Compare logos (identical?)

5. TAMPERING INDICATORS:
   - Photo editing/manipulation
   - Text overlay
   - Digital alterations
   - Font inconsistencies

6. RECOMMENDATION:
   - Authentic (exact match)
   - Suspicious (differences need review)
   - Fraudulent (clear tampering)

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
      { inlineData: verifiedImage.inlineData },
      { inlineData: uploadedImage.inlineData }
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
    console.error('Gemini comparison error:', error);
    return {
      success: false,
      error: error.message,
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
    return {
      success: false,
      error: error.message,
      markers: null
    };
  }
}

module.exports = {
  analyzeCredentialType,
  compareCredentialImages,
  detectAuthenticityMarkers
};
