// fileName: tesseractService.js
// OCR-based file comparison service using Tesseract.js with Gemini AI integration
// Updated: Removed pdf-poppler dependency, using pure JavaScript PDF processing with pdfjs-dist

const Tesseract = require('tesseract.js');
const axios = require('axios');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

// Import Path2D polyfill for PDF.js in Node.js environment
require('path2d-polyfill');

const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const { createCanvas } = require('canvas');
const geminiService = require('./geminiService');

// Configure PDF.js to work in Node.js environment
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.js');

/**
 * Normalize credential type names to handle variations
 * @param {string} type - Credential type to normalize
 * @returns {string} - Normalized type
 */
function normalizeCredentialType(type) {
  if (!type) return null;
  
  const normalized = type.toLowerCase().trim();
  
  // Transcript variations - all normalize to "Transcript"
  if (normalized.includes('transcript') || normalized.includes('tor') || 
      normalized.includes('academic record') || normalized.includes('grade report')) {
    return 'Transcript';
  }
  
  // Certificate of Graduation variations - CHECK FIRST before Bachelor/Master/PhD
  // These are graduation certificates that may mention degree names but are primarily certificates
  if (normalized.includes('certificate of graduation') || 
      normalized.includes('graduation certificate') ||
      normalized.includes('completion certificate') ||
      normalized.includes('certificate of completion')) {
    return 'Certificate of Graduation';
  }
  
  // PhD variations
  if (normalized.includes('phd') || normalized.includes('ph.d') || 
      normalized.includes('doctorate') || normalized.includes('doctoral')) {
    return 'PhD Degree';
  }
  
  // Master variations
  if (normalized.includes('master')) {
    return 'Master Degree';
  }
  
  // Bachelor variations - but NOT if it's a Certificate of Graduation
  if (normalized.includes('bachelor')) {
    return 'Bachelor Degree';
  }
  
  // Diploma variations
  if (normalized.includes('diploma')) {
    return 'Diploma';
  }
  
  // Certificate variations (check this last to avoid matching "Certificate of Graduation")
  if (normalized.includes('certificate')) {
    return 'Certificate';
  }
  
  // Award variations
  if (normalized.includes('award') || normalized.includes('achievement')) {
    return 'Achievement Award';
  }
  
  // Letter of Recommendation
  if (normalized.includes('recommendation') || normalized.includes('reference letter')) {
    return 'Letter of Recommendation';
  }
  
  // Return original if no match
  return type;
}

// Credential type keywords for identification
// IMPORTANT: Ordered from most specific to least specific to avoid false matches
// Certificate of Graduation MUST come before Bachelor/Master to avoid misdetection
const CREDENTIAL_TYPE_KEYWORDS = {
  'Transcript': [
    'transcript of records',
    'academic transcript', 
    'official transcript',
    'student transcript',
    'transcript of record',
    'grade transcript',
    'transcript'
  ],
  'Certificate of Graduation': [
    'certificate of graduation',
    'graduation certificate',
    'completion certificate', 
    'certificate of completion',
    'certify.*completion',
    'certify.*graduation'
  ],
  'PhD Degree': [
    'doctor of philosophy',
    'ph.d. degree',
    'ph.d degree',
    'phd degree',
    'doctorate degree',
    'doctoral degree'
  ],
  'Master Degree': [
    'master\'s degree',
    'masters degree',
    'master of science',
    'master of arts',
    'master of business',
    'postgraduate degree',
    'mba'
  ],
  'Bachelor Degree': [
    'bachelor\'s degree',
    'bachelors degree',
    'bachelor of science degree',
    'bachelor of arts degree',
    'baccalaureate degree',
    'undergraduate degree'
  ],
  'Diploma': [
    'advanced diploma',
    'graduate diploma',
    'diploma in',
    'diploma of',
    'diploma'
  ],
  'Certificate': [
    'certificate of achievement',
    'certificate in',
    'certificate of',
    'certify that',
    'certification',
    'certificate'
  ],
  'Achievement Award': [
    'achievement award',
    'award for',
    'awarded to',
    'recognition',
    'honor',
    'honours'
  ],
  'Letter of Recommendation': [
    'letter of recommendation',
    'recommendation letter',
    'reference letter',
    'letter of reference'
  ]
};

/**
 * Convert PDF page to image using PDF.js (pure JavaScript solution)
 * @param {string} pdfPath - Path to PDF file
 * @param {number} pageNumber - Page number to convert (default: 1)
 * @param {number} scale - Scale factor for rendering (default: 2.0 for better quality)
 * @returns {Promise<string>} - Path to the generated PNG image
 */
async function convertPdfPageToImage(pdfPath, pageNumber = 1, scale = 2.0) {
  try {
    console.log(`Converting PDF page ${pageNumber} to image with scale ${scale}...`);
    
    // Read PDF file
    const pdfBuffer = await fs.readFile(pdfPath);
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      verbosity: 0 // Suppress PDF.js warnings
    });
    const pdfDocument = await loadingTask.promise;
    
    // Get the specified page
    const page = await pdfDocument.getPage(pageNumber);
    
    // Get viewport with scale
    const viewport = page.getViewport({ scale });
    
    // Create canvas
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');
    
    // Set white background for better OCR
    context.fillStyle = 'white';
    context.fillRect(0, 0, viewport.width, viewport.height);
    
    // Render PDF page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
    
    // Save canvas as PNG
    const tempDir = path.dirname(pdfPath);
    const outputPath = path.join(tempDir, `temp_pdf_${Date.now()}_page${pageNumber}.png`);
    
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(outputPath, buffer);
    
    console.log(`PDF page converted successfully to: ${outputPath}`);
    return outputPath;
    
  } catch (error) {
    console.error('PDF to image conversion error:', error);
    throw new Error('Failed to convert PDF page to image: ' + error.message);
  }
}

/**
 * Extract text from an image or PDF using Tesseract OCR
 * PDFs are converted to images first using PDF.js (pure JavaScript)
 * @param {string} filePath - Path to the image or PDF file
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromImage(filePath) {
  let tempImagePath = null;
  
  try {
    const ext = path.extname(filePath).toLowerCase();
    
    // Check file content to determine if it's a PDF (in case extension is wrong)
    const fileBuffer = await fs.readFile(filePath);
    const isPDF = ext === '.pdf' || fileBuffer.toString('utf8', 0, 4) === '%PDF';
    
    // Handle PDF files - convert to image first, then OCR
    if (isPDF) {
      console.log('PDF detected. Processing with PDF.js:', filePath);
      
      try {
        // Try pdf-parse first (for text-based PDFs)
        const pdfData = await pdfParse(fileBuffer);
        
        if (pdfData.text && pdfData.text.trim().length > 100) {
          console.log('PDF has extractable text. Text length:', pdfData.text.length);
          return pdfData.text;
        }
        
        console.log('PDF appears to be image-based or has minimal text. Converting to image with PDF.js...');
      } catch (parseError) {
        console.log('PDF text extraction failed. Converting to image with PDF.js...');
      }
      
      // Convert PDF to image using PDF.js (pure JavaScript - first page)
      try {
        console.log('Converting PDF to image using PDF.js...');
        tempImagePath = await convertPdfPageToImage(filePath, 1, 2.0);
        
        console.log('PDF converted to image. Running OCR...');
        
        // Run OCR on the converted image
        const { data: { text } } = await Tesseract.recognize(
          tempImagePath,
          'eng',
          {
            logger: m => {
              if (m.status === 'recognizing text') {
                console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
              }
            }
          }
        );
        
        // Cleanup temp image
        try {
          await fs.unlink(tempImagePath);
          console.log('Temporary image cleaned up');
        } catch (cleanupErr) {
          console.warn('Failed to cleanup temp image:', cleanupErr);
        }
        
        console.log('PDF OCR completed. Text length:', text.length);
        return text;
        
      } catch (conversionError) {
        console.error('PDF to image conversion error:', conversionError);
        
        // Cleanup if exists
        if (tempImagePath) {
          try {
            await fs.unlink(tempImagePath);
          } catch (cleanupErr) {
            // Ignore cleanup errors
          }
        }
        
        // Return empty text if conversion fails
        console.log('PDF conversion failed. Returning empty text.');
        return '';
      }
    }
    
    // Handle regular image files with Tesseract OCR
    console.log('Extracting text from image:', filePath);
    
    const { data: { text } } = await Tesseract.recognize(
      filePath,
      'eng',
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );
    
    console.log('Text extraction completed. Text length:', text.length);
    return text;
  } catch (error) {
    console.error('Text extraction error:', error);
    
    // Cleanup temp image if it exists
    if (tempImagePath) {
      try {
        await fs.unlink(tempImagePath);
      } catch (cleanupErr) {
        // Ignore cleanup errors
      }
    }
    
    throw new Error('Failed to extract text from file: ' + error.message);
  }
}

/**
 * Identify credential type from extracted text with context-aware matching
 * @param {string} text - Extracted text content
 * @returns {string|null} - Identified credential type or null
 */
function identifyCredentialType(text) {
  if (!text || text.trim().length < 10) {
    console.log('Text too short for credential type identification');
    return null;
  }
  
  const lowercaseText = text.toLowerCase();
  
  // PRIORITY 1: Check for multi-word phrases first (most specific)
  const multiWordPhrases = {
    'Certificate of Graduation': [
      'certificate of graduation',
      'graduation certificate',
      'completion certificate',
      'certificate of completion'
    ],
    'Transcript': [
      'transcript of records',
      'transcript of record',
      'academic transcript',
      'official transcript',
      'student transcript'
    ],
    'Bachelor Degree': [
      'bachelor\'s degree',
      'bachelors degree',
      'bachelor of science',
      'bachelor of arts',
      'baccalaureate'
    ],
    'Master Degree': [
      'master\'s degree',
      'masters degree',
      'master of science',
      'master of arts',
      'master of business'
    ],
    'PhD Degree': [
      'doctor of philosophy',
      'ph.d. degree',
      'phd degree',
      'doctorate degree',
      'doctoral degree'
    ]
  };
  
  // Check multi-word phrases first
  for (const [type, phrases] of Object.entries(multiWordPhrases)) {
    for (const phrase of phrases) {
      if (lowercaseText.includes(phrase)) {
        console.log(`Credential type identified: ${type} (matched phrase: "${phrase}")`);
        return type;
      }
    }
  }
  
  // PRIORITY 2: Check for single words with high confidence (if no multi-word match)
  const singleWordKeywords = {
    'Transcript': ['transcript'],
    'Diploma': ['diploma'],
    'Certificate': ['certificate'], // Only matches if no "certificate of graduation" found
    'Achievement Award': ['award', 'achievement']
  };
  
  // Score-based matching for remaining keywords
  let bestMatch = { type: null, score: 0, keyword: '' };
  
  for (const [type, keywords] of Object.entries(singleWordKeywords)) {
    for (const keyword of keywords) {
      if (lowercaseText.includes(keyword)) {
        // Longer keywords get higher scores (more specific)
        const score = keyword.length;
        
        if (score > bestMatch.score) {
          bestMatch = { type, score, keyword };
        }
      }
    }
  }
  
  if (bestMatch.type) {
    console.log(`Credential type identified: ${bestMatch.type} (matched keyword: "${bestMatch.keyword}", score: ${bestMatch.score})`);
    return bestMatch.type;
  }
  
  console.log('No credential type identified from text');
  return null;
}

/**
 * Download file from IPFS
 * @param {string} ipfsCid - IPFS CID
 * @param {string} tempDir - Temporary directory
 * @returns {Promise<string>} - Path to downloaded file
 */
async function downloadFromIPFS(ipfsCid, tempDir) {
  try {
    const ipfsGateway = process.env.PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud';
    const url = `${ipfsGateway}/ipfs/${ipfsCid}`;
    
    console.log('Downloading file from IPFS:', url);
    
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000 // 30 seconds timeout
    });
    
    // Detect file type from response headers or content
    let extension = '.tmp';
    const contentType = response.headers['content-type'];
    
    if (contentType) {
      if (contentType.includes('pdf')) {
        extension = '.pdf';
      } else if (contentType.includes('image/jpeg') || contentType.includes('image/jpg')) {
        extension = '.jpg';
      } else if (contentType.includes('image/png')) {
        extension = '.png';
      } else if (contentType.includes('image/gif')) {
        extension = '.gif';
      } else if (contentType.includes('image/bmp')) {
        extension = '.bmp';
      } else if (contentType.includes('image/tiff')) {
        extension = '.tiff';
      }
    }
    
    // Check if file starts with PDF signature
    const buffer = Buffer.from(response.data);
    if (buffer.length > 4 && buffer.toString('utf8', 0, 4) === '%PDF') {
      extension = '.pdf';
    }
    
    const filePath = path.join(tempDir, `verified_${ipfsCid.substring(0, 10)}${extension}`);
    await fs.writeFile(filePath, response.data);
    
    console.log('File downloaded successfully to:', filePath);
    return filePath;
  } catch (error) {
    console.error('IPFS download error:', error);
    throw new Error('Failed to download file from IPFS: ' + error.message);
  }
}

/**
 * Compare two text strings and find differences
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {Object} - Comparison result with differences
 */
function compareTexts(text1, text2) {
  // Normalize texts for comparison
  const normalize = (text) => text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  
  const normalizedText1 = normalize(text1);
  const normalizedText2 = normalize(text2);
  
  // Split into words for detailed comparison
  const words1 = normalizedText1.split(' ');
  const words2 = normalizedText2.split(' ');
  
  // Calculate similarity percentage
  const longerLength = Math.max(words1.length, words2.length);
  const editDistance = calculateLevenshteinDistance(normalizedText1, normalizedText2);
  const similarity = ((longerLength - editDistance) / longerLength) * 100;
  
  // Find differences - words in text1 not in text2 and vice versa
  const uniqueToText1 = words1.filter(word => !words2.includes(word) && word.length > 2);
  const uniqueToText2 = words2.filter(word => !words1.includes(word) && word.length > 2);
  
  // Find common words
  const commonWords = words1.filter(word => words2.includes(word));
  
  return {
    similarity: Math.round(similarity * 100) / 100,
    totalWords1: words1.length,
    totalWords2: words2.length,
    commonWords: commonWords.length,
    uniqueToVerified: uniqueToText1.slice(0, 50), // Limit to first 50 for display
    uniqueToUploaded: uniqueToText2.slice(0, 50),
    hasSignificantDifferences: similarity < 80,
    differences: {
      addedWords: uniqueToText2.length,
      removedWords: uniqueToText1.length,
      modifiedPercentage: Math.round((1 - similarity / 100) * 100)
    }
  };
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Edit distance
 */
function calculateLevenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Extract key sections from text for detailed comparison
 * @param {string} text - Text content
 * @returns {Object} - Extracted sections
 */
function extractKeySections(text) {
  const sections = {
    header: '',
    body: '',
    footer: ''
  };
  
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length > 0) {
    // First 5 lines as header
    sections.header = lines.slice(0, 5).join('\n');
    
    // Middle section as body
    const middleStart = 5;
    const middleEnd = Math.max(5, lines.length - 5);
    sections.body = lines.slice(middleStart, middleEnd).join('\n');
    
    // Last 5 lines as footer
    sections.footer = lines.slice(-5).join('\n');
  }
  
  return sections;
}

/**
 * Main function to process and compare two credential files
 * @param {string} verifiedFilePath - Path to verified file from IPFS
 * @param {string} uploadedFilePath - Path to user uploaded file
 * @param {string} dbCredentialType - Credential type from database (optional)
 * @returns {Promise<Object>} - Comparison result
 */
async function compareCredentialFiles(verifiedFilePath, uploadedFilePath, dbCredentialType = null) {
  try {
    console.log('Starting credential file comparison...');
    
    // Extract text from both files
    console.log('Extracting text from verified file...');
    const verifiedText = await extractTextFromImage(verifiedFilePath);
    console.log('Verified text extracted. Length:', verifiedText.length);
    
    console.log('Extracting text from uploaded file...');
    const uploadedText = await extractTextFromImage(uploadedFilePath);
    console.log('Uploaded text extracted. Length:', uploadedText.length);
    
    // Check if texts are empty or too short
    const verifiedTextLength = verifiedText.trim().length;
    const uploadedTextLength = uploadedText.trim().length;
    
    console.log('Verified text length:', verifiedTextLength);
    console.log('Uploaded text length:', uploadedTextLength);
    
    if (verifiedTextLength < 20 || uploadedTextLength < 20) {
      return {
        success: false,
        error: 'Insufficient text extracted',
        message: 'Could not extract meaningful text from one or both files. This may occur with image-based PDFs, scanned documents, or corrupted files. Please ensure files are clear and readable.',
        verifiedType: 'Unable to extract text',
        uploadedType: 'Unable to extract text',
        verifiedTextLength,
        uploadedTextLength
      };
    }
    
    if (verifiedTextLength < 50 || uploadedTextLength < 50) {
      console.warn('Warning: One or both files have very little text. Comparison may be less accurate.');
    }
    
    // Identify credential types
    // Use database credential type for verified file if available
    const verifiedTypeRaw = dbCredentialType || identifyCredentialType(verifiedText);
    const uploadedTypeRaw = identifyCredentialType(uploadedText);
    
    // Normalize types to handle variations (e.g., "Transcript of Records" = "Transcript")
    const verifiedType = normalizeCredentialType(verifiedTypeRaw);
    const uploadedType = normalizeCredentialType(uploadedTypeRaw);
    
    console.log('Verified credential type (raw):', verifiedTypeRaw);
    console.log('Verified credential type (normalized):', verifiedType);
    console.log('Uploaded credential type (raw):', uploadedTypeRaw);
    console.log('Uploaded credential type (normalized):', uploadedType);
    
    // If one or both types couldn't be identified, proceed with warning
    const typeWarning = !verifiedType || !uploadedType 
      ? 'Warning: Could not confidently identify credential type from one or both files. Comparison will proceed but results may be less accurate.'
      : null;
    
    // Compare text contents
    console.log('Comparing text contents...');
    const comparison = compareTexts(verifiedText, uploadedText);
    
    // Extract key sections for detailed view
    const verifiedSections = extractKeySections(verifiedText);
    const uploadedSections = extractKeySections(uploadedText);
    
    // Return structure compatible with AI-enhanced results
    return {
      success: true,
      verifiedType: verifiedType || 'Unknown',
      uploadedType: uploadedType || 'Unknown',
      
      // OCR-only mode indicators
      overallStatus: comparison.similarity >= 95 ? 'identical' : 
                     comparison.similarity >= 80 ? 'authentic' : 
                     comparison.similarity >= 60 ? 'suspicious' : 'fraudulent',
      statusMessage: comparison.similarity >= 95 ? 'Documents appear identical (OCR-only comparison)' :
                     comparison.similarity >= 80 ? 'Files appear to match (OCR-only comparison)' :
                     comparison.similarity >= 60 ? 'Partial match - Review recommended (OCR-only comparison)' : 
                     'Significant differences detected (OCR-only comparison)',
      matchConfidence: 'OCR-only (AI unavailable)',
      
      // OCR Comparison data
      ocrComparison: comparison,
      verifiedText: verifiedText.substring(0, 5000),
      uploadedText: uploadedText.substring(0, 5000),
      
      // Key findings without AI
      keyFindings: {
        credentialTypeMatch: verifiedType === uploadedType,
        exactSameDocument: comparison.similarity >= 95,
        textSimilarity: comparison.similarity,
        authenticityScore: null, // Not available without AI
        tamperingDetected: false, // Not available without AI
        sealMatch: null, // Not available without AI
        signatureMatch: null // Not available without AI
      },
      
      typeWarning,
      verifiedSections,
      uploadedSections,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Credential comparison error:', error);
    throw error;
  }
}

/**
 * Process file comparison request with IPFS download
 * @param {string} ipfsCid - IPFS CID of verified file
 * @param {string} uploadedFilePath - Path to uploaded file
 * @param {string} tempDir - Temporary directory
 * @returns {Promise<Object>} - Comparison result
 */
async function processComparisonWithIPFS(ipfsCid, uploadedFilePath, tempDir) {
  let verifiedFilePath = null;
  
  try {
    // Download verified file from IPFS
    verifiedFilePath = await downloadFromIPFS(ipfsCid, tempDir);
    
    // Compare the files
    const result = await compareCredentialFiles(verifiedFilePath, uploadedFilePath);
    
    // Cleanup verified file
    if (verifiedFilePath) {
      try {
        await fs.unlink(verifiedFilePath);
      } catch (err) {
        console.error('Failed to cleanup verified file:', err);
      }
    }
    
    return result;
    
  } catch (error) {
    // Cleanup on error
    if (verifiedFilePath) {
      try {
        await fs.unlink(verifiedFilePath);
      } catch (err) {
        console.error('Failed to cleanup verified file on error:', err);
      }
    }
    throw error;
  }
}

/**
 * AI-Enhanced comparison with Gemini visual analysis + OCR text comparison
 * @param {string} ipfsCid - IPFS CID of verified file
 * @param {string} uploadedFilePath - Path to uploaded file
 * @param {string} tempDir - Temporary directory
 * @param {string} dbCredentialType - Credential type from database (optional)
 * @returns {Promise<Object>} - Comprehensive comparison result
 */
async function processAIEnhancedComparison(ipfsCid, uploadedFilePath, tempDir, dbCredentialType = null, progressCallback = null) {
  console.log('\n\n🔥 === AI-Enhanced Credential Comparison Started ===');
  console.log('📋 Parameters:', { ipfsCid, uploadedFilePath, tempDir, dbCredentialType });
  
  // Helper to send progress updates
  const updateProgress = (message, percent) => {
    console.log(`[${percent}%] ${message}`);
    if (progressCallback) progressCallback(message, percent);
  };
  
  let verifiedFilePath = null;
  
  try {
    // Step 1: Download verified file from IPFS
    updateProgress('📥 Downloading verified credential from IPFS...', 10);
    verifiedFilePath = await downloadFromIPFS(ipfsCid, tempDir);
    updateProgress('✅ Verified credential downloaded', 20);
    
    // Step 2: AI Visual Analysis (Gemini supports PDFs directly!)
    updateProgress('🤖 Starting AI visual analysis with Gemini 2.0...', 25);
    
    // Analyze verified credential type
    updateProgress('  → AI analyzing verified credential type...', 30);
    const verifiedAnalysis = await geminiService.analyzeCredentialType(verifiedFilePath);
    updateProgress('  ✅ Verified credential analyzed', 40);
    
    // Analyze uploaded credential type
    updateProgress('  → AI analyzing uploaded credential type...', 45);
    const uploadedAnalysis = await geminiService.analyzeCredentialType(uploadedFilePath);
    updateProgress('  ✅ Uploaded credential analyzed', 55);
    
    // Compare both credentials visually
    updateProgress('  → AI comparing credentials visually...', 60);
    const visualComparison = await geminiService.compareCredentialImages(
      verifiedFilePath,
      uploadedFilePath
    );
    updateProgress('  ✅ Visual comparison completed', 70);
    
    // Detect authenticity markers
    updateProgress('  → AI detecting authenticity markers...', 75);
    const verifiedMarkers = await geminiService.detectAuthenticityMarkers(verifiedFilePath);
    const uploadedMarkers = await geminiService.detectAuthenticityMarkers(uploadedFilePath);
    updateProgress('  ✅ Authenticity markers detected', 80);
    
    
    // Check if AI analysis was successful
    if (!verifiedAnalysis.success || !uploadedAnalysis.success || !visualComparison.success) {
      // Check if quota was exhausted
      const quotaExhausted = verifiedAnalysis.quotaExhausted || uploadedAnalysis.quotaExhausted || visualComparison.quotaExhausted;
      
      if (quotaExhausted) {
        updateProgress('⚠️  Gemini AI quota exhausted - using OCR-only mode...', 85);
        console.log('   ⚠️  NOTICE: Gemini AI free tier quota has been exhausted.');
        console.log('   ℹ️  The comparison will continue using OCR-only mode.');
        console.log('   ℹ️  Free tier resets daily. Check: https://aistudio.google.com/');
      } else {
        updateProgress('⚠️  AI analysis failed, falling back to OCR-only...', 85);
        if (!verifiedAnalysis.success) {
          console.log('   ❌ Verified analysis error:', verifiedAnalysis.error);
        }
        if (!uploadedAnalysis.success) {
          console.log('   ❌ Uploaded analysis error:', uploadedAnalysis.error);
        }
        if (!visualComparison.success) {
          console.log('   ❌ Visual comparison error:', visualComparison.error);
        }
      }
      
      // Fallback to OCR-only comparison
      const ocrResult = await compareCredentialFiles(verifiedFilePath, uploadedFilePath, dbCredentialType);
      
      // Add quota warning to result if applicable
      if (quotaExhausted) {
        ocrResult.quotaWarning = 'Gemini AI free tier quota exhausted. Comparison completed using OCR-only mode. AI features will be available after quota resets (usually daily).';
      }
      
      return ocrResult;
    }
    
    updateProgress('✅ AI visual analysis completed successfully!', 82);
    
    
    // Extract credential types from AI analysis
    const verifiedTypeRaw = dbCredentialType || verifiedAnalysis.analysis.documentType;
    const uploadedTypeRaw = uploadedAnalysis.analysis.documentType;
    const verifiedType = normalizeCredentialType(verifiedTypeRaw);
    const uploadedType = normalizeCredentialType(uploadedTypeRaw);
    
    console.log('📋 Credential Types:');
    console.log('   Verified:', verifiedType, '(confidence:', verifiedAnalysis.analysis.confidence + ')');
    console.log('   Uploaded:', uploadedType, '(confidence:', uploadedAnalysis.analysis.confidence + ')');
    console.log('   AI Match:', visualComparison.comparison?.sameCredentialType ? '✅ Same type' : '⚠️  Different types');
    
    const exactMatch = visualComparison.comparison.exactSameDocument;
    const matchConfidence = visualComparison.comparison.matchConfidence;
    
    // Step 3: OCR Text Extraction
    updateProgress('📝 Extracting text with OCR (Tesseract.js)...', 85);
    const verifiedText = await extractTextFromImage(verifiedFilePath);
    updateProgress('  → Verified credential text extracted', 90);
    const uploadedText = await extractTextFromImage(uploadedFilePath);
    updateProgress('  → Uploaded credential text extracted', 93);
    
    // Step 4: Text Comparison
    updateProgress('🔍 Comparing text content...', 95);
    const textComparison = compareTexts(verifiedText, uploadedText);
    updateProgress('✅ Text comparison completed', 97);
    
    // Combine AI visual analysis with OCR text comparison
    updateProgress('📊 Generating comprehensive report...', 98);
    
    // Determine overall match status
    let overallStatus = 'authentic';
    let statusMessage = 'Files appear to be authentic and match';
    
    if (visualComparison.comparison.recommendation === 'Fraudulent' ||
        visualComparison.comparison.tamperingIndicators.severity === 'Severe') {
      overallStatus = 'fraudulent';
      statusMessage = 'ALERT: Strong indicators of tampering or fraud detected';
    } else if (visualComparison.comparison.recommendation === 'Suspicious' ||
               textComparison.similarity < 80 ||
               !visualComparison.comparison.authenticityMarkers.sealMatch ||
               !visualComparison.comparison.authenticityMarkers.signatureMatch) {
      overallStatus = 'suspicious';
      statusMessage = 'Warning: Differences detected that require review';
    } else if (exactMatch && textComparison.similarity >= 95) {
      overallStatus = 'identical';
      statusMessage = 'Documents are identical - perfect match';
    }
    
    // Cleanup temporary files
    if (verifiedFilePath) {
      try {
        await fs.unlink(verifiedFilePath);
      } catch (err) {
        console.error('Failed to cleanup verified file:', err);
      }
    }
    
    updateProgress('✅ Comparison complete!', 100);
    console.log('\n✅ === AI-Enhanced Comparison Complete ===\n');
    
    // Return comprehensive result
    return {
      success: true,
      verifiedType,
      uploadedType,
      
      // AI Visual Analysis
      aiAnalysis: {
        verifiedCredential: verifiedAnalysis.analysis,
        uploadedCredential: uploadedAnalysis.analysis,
        visualComparison: visualComparison.comparison,
        authenticityMarkers: {
          verified: verifiedMarkers.success ? verifiedMarkers.markers : null,
          uploaded: uploadedMarkers.success ? uploadedMarkers.markers : null
        }
      },
      
      // OCR Text Comparison
      ocrComparison: textComparison,
      verifiedText: verifiedText.substring(0, 5000),
      uploadedText: uploadedText.substring(0, 5000),
      
      // Combined Results
      overallStatus,
      statusMessage,
      matchConfidence,
      
      // Key Findings
      keyFindings: {
        credentialTypeMatch: visualComparison.comparison.sameCredentialType,
        exactSameDocument: exactMatch,
        textSimilarity: textComparison.similarity,
        visualChangesDetected: visualComparison.comparison.visualDifferences,
        authenticityScore: visualComparison.comparison.authenticityMarkers.overallAuthenticityScore,
        tamperingDetected: visualComparison.comparison.tamperingIndicators.detected,
        tamperingSeverity: visualComparison.comparison.tamperingIndicators.severity,
        sealMatch: visualComparison.comparison.authenticityMarkers.sealMatch,
        signatureMatch: visualComparison.comparison.authenticityMarkers.signatureMatch
      },
      
      // Specific Tampering Details (field-by-field)
      specificTampering: visualComparison.comparison.specificTampering || [],
      
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ AI-Enhanced comparison error:', error);
    console.error('Error stack:', error.stack);
    
    // Cleanup on error
    if (verifiedFilePath) {
      try {
        await fs.unlink(verifiedFilePath);
      } catch (err) {
        console.error('Failed to cleanup verified file on error:', err);
      }
    }
    
    throw error;
  }
}

module.exports = {
  extractTextFromImage,
  identifyCredentialType,
  downloadFromIPFS,
  compareTexts,
  compareCredentialFiles,
  processComparisonWithIPFS,
  processAIEnhancedComparison,
  convertPdfPageToImage,
  normalizeCredentialType
};