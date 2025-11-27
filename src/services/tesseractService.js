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
const { logMetric } = require('./metricsService');

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
 * Post-process OCR text to improve readability and accuracy
 * @param {string} text - Raw OCR text
 * @returns {string} - Cleaned and processed text
 */
function postProcessOcrText(text) {
  if (!text || text.trim().length === 0) {
    return text;
  }
  
  let processed = text;
  
  // 1. Fix common OCR character recognition errors
  const commonOcrErrors = {
    // Common number/letter confusions
    '0': /(?<=[A-Z])[0O](?=[A-Z])/g,  // O to 0 in letter sequences
    'O': /(?<=\d)[O0](?=\d)/g,         // 0 to O in number sequences
    'l': /(?<=\d)[Il](?=\d)/g,        // I/l to 1 in numbers
    '1': /(?<=[A-Z])[1I](?=[A-Z])/g,  // 1 to I in letter sequences
    'S': /(?<=\d)[S$](?=\d)/g,        // S to 5 in numbers
    '5': /(?<=[A-Z])[5S](?=[A-Z])/g,  // 5 to S in letter sequences
  };
  
  // Apply common error corrections cautiously
  // (Disabled for now to avoid over-correction)
  
  // 2. Remove excessive whitespace while preserving structure
  processed = processed
    .replace(/\t+/g, ' ')              // Convert tabs to spaces
    .replace(/[ \t]{3,}/g, '  ')       // Reduce multiple spaces to max 2
    .replace(/\n{4,}/g, '\n\n\n');     // Limit consecutive newlines to 3
  
  // 3. Fix broken words at line endings (but preserve intentional line breaks)
  // Don't join lines that end with periods, colons, etc.
  processed = processed.replace(/([a-z])-\n([a-z])/g, '$1$2');
  
  // 4. Clean up common OCR artifacts
  processed = processed
    .replace(/[‚„"]/g, '"')           // Normalize quotes
    .replace(/['']/g, "'")             // Normalize apostrophes
    .replace(/…/g, '...')              // Fix ellipsis
    .replace(/—/g, '-')                // Normalize dashes
    .replace(/\|/g, 'I')               // Pipe to I (common OCR error in names)
    .replace(/[^\x00-\x7F]/g, (char) => {  // Handle special characters
      const replacements = {
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
        'á': 'a', 'à': 'a', 'â': 'a', 'ä': 'a',
        'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
        'ó': 'o', 'ò': 'o', 'ô': 'o', 'ö': 'o',
        'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
        'ñ': 'n', 'ç': 'c'
      };
      return replacements[char] || char;
    });
  
  // 5. Fix spacing around punctuation
  processed = processed
    .replace(/\s+([.,;:!?)])/g, '$1')  // Remove space before punctuation
    .replace(/([(\[])\s+/g, '$1')      // Remove space after opening brackets
    .replace(/([.,;:!?])\s{2,}/g, '$1 '); // Single space after punctuation
  
  // 6. Trim each line and remove empty lines at start/end
  processed = processed
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim();
  
  // 7. Fix common credential-specific patterns
  processed = processed
    .replace(/\bG\.?P\.?A\.?\s*:?\s*/gi, 'GPA: ')  // Normalize GPA format
    .replace(/\bI\.?D\.?\s*:?\s*/gi, 'ID: ')       // Normalize ID format
    .replace(/\bNo\.?\s+/gi, 'No. ')               // Normalize number format
    .replace(/\bDr\.?\s+/gi, 'Dr. ')               // Normalize Dr. title
    .replace(/\bMr\.?\s+/gi, 'Mr. ')               // Normalize Mr. title
    .replace(/\bMs\.?\s+/gi, 'Ms. ')               // Normalize Ms. title
    .replace(/\bProf\.?\s+/gi, 'Prof. ');          // Normalize Prof. title
  
  return processed;
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
        
        // Run OCR on the converted image with enhanced settings
        let lastPdfOcrProgress = -1;
        const { data: { text } } = await Tesseract.recognize(
          tempImagePath,
          'eng',
          {
            tessedit_pageseg_mode: Tesseract.PSM.AUTO_OSD,
            preserve_interword_spaces: '1',
            load_system_dawg: '1',
            load_freq_dawg: '1',
            load_punc_dawg: '1',
            load_number_dawg: '1',
            load_unambig_dawg: '1',
            load_bigram_dawg: '1',
            load_fixed_length_dawgs: '1',
            tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
            tessedit_char_blacklist: '',
            logger: m => {
              if (m.status === 'recognizing text') {
                const percent = Math.round(m.progress * 100);
                if (percent !== lastPdfOcrProgress && percent % 10 === 0) {
                  console.log(`OCR Progress: ${percent}% (PDF High Accuracy)`);
                  lastPdfOcrProgress = percent;
                }
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
    
    // Handle regular image files with Tesseract OCR (Enhanced Configuration)
    console.log('Extracting text from image with enhanced OCR settings:', filePath);
    
    let lastImageOcrProgress = -1;
    
    // Enhanced Tesseract configuration for better accuracy
    const { data: { text } } = await Tesseract.recognize(
      filePath,
      'eng',
      {
        // Use PSM 1 for better page orientation detection and layout analysis
        // PSM 1 = Automatic page segmentation with OSD (best for documents)
        // PSM 3 = Fully automatic page segmentation (default)
        // PSM 6 = Assume a single uniform block of text
        tessedit_pageseg_mode: Tesseract.PSM.AUTO_OSD,
        
        // Preserve interword spaces to maintain document structure
        preserve_interword_spaces: '1',
        
        // Enable all available language models for better accuracy
        load_system_dawg: '1',
        load_freq_dawg: '1',
        load_punc_dawg: '1',
        load_number_dawg: '1',
        load_unambig_dawg: '1',
        load_bigram_dawg: '1',
        load_fixed_length_dawgs: '1',
        
        // OCR Engine Mode: Use both LSTM and Legacy engines for best results
        // 0 = Legacy engine only
        // 1 = Neural nets LSTM engine only
        // 2 = Legacy + LSTM engines (BEST ACCURACY)
        // 3 = Default, based on what is available
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
        
        // No character blacklist - allow all characters
        tessedit_char_blacklist: '',
        
        logger: m => {
          if (m.status === 'recognizing text') {
            const percent = Math.round(m.progress * 100);
            if (percent !== lastImageOcrProgress && percent % 10 === 0) {
              console.log(`OCR Progress: ${percent}% (High Accuracy Mode)`);
              lastImageOcrProgress = percent;
            }
          }
        }
      }
    );
    
    // Post-process text to improve readability
    const cleanedText = postProcessOcrText(text);
    
    console.log('Text extraction completed. Original length:', text.length, 'Cleaned length:', cleanedText.length);
    return cleanedText;
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
 * Compare two text strings and find differences with enhanced number sensitivity
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
  
  // ENHANCED: Extract all numbers (dates, IDs, grades, years, etc.) for sensitive comparison
  const numberPattern = /\b\d+\.?\d*\b/g;
  const numbers1 = (text1.match(numberPattern) || []).map(n => n.toLowerCase());
  const numbers2 = (text2.match(numberPattern) || []).map(n => n.toLowerCase());
  
  // Compare numbers separately - even one number difference is critical
  const numberDifferences = [];
  const allNumbers = new Set([...numbers1, ...numbers2]);
  
  allNumbers.forEach(num => {
    const count1 = numbers1.filter(n => n === num).length;
    const count2 = numbers2.filter(n => n === num).length;
    if (count1 !== count2) {
      numberDifferences.push({
        value: num,
        inVerified: count1,
        inUploaded: count2
      });
    }
  });
  
  // Calculate CHARACTER-level similarity (more sensitive to small changes)
  const charEditDistance = calculateLevenshteinDistance(normalizedText1, normalizedText2);
  const maxLength = Math.max(normalizedText1.length, normalizedText2.length);
  const charSimilarity = maxLength > 0 ? ((maxLength - charEditDistance) / maxLength) * 100 : 100;
  
  // Calculate WORD-level similarity
  const longerLength = Math.max(words1.length, words2.length);
  const wordSimilarity = longerLength > 0 ? (Math.min(words1.length, words2.length) / longerLength) * 100 : 100;
  
  // Use CHARACTER similarity as the primary metric (more accurate for detecting tampering)
  let finalSimilarity = charSimilarity;
  
  // If numbers differ, PENALIZE the similarity heavily (numbers are critical in credentials)
  if (numberDifferences.length > 0) {
    // Each number difference reduces similarity by 5-10%
    const numberPenalty = Math.min(numberDifferences.length * 7, 50);
    finalSimilarity = Math.max(0, finalSimilarity - numberPenalty);
    console.log(`⚠️ NUMBER TAMPERING DETECTED: ${numberDifferences.length} numeric differences found. Reducing similarity by ${numberPenalty}%`);
  }
  
  // Find differences - words in text1 not in text2 and vice versa
  const uniqueToText1 = words1.filter(word => !words2.includes(word) && word.length > 1);
  const uniqueToText2 = words2.filter(word => !words1.includes(word) && word.length > 1);
  
  // Find common words
  const commonWords = words1.filter(word => words2.includes(word));
  
  // Detect if there's a mismatch between character and word similarity (indicates visual tampering)
  const potentialTampering = Math.abs(charSimilarity - wordSimilarity) > 5 || numberDifferences.length > 0;
  
  console.log(`OCR Comparison: Char=${charSimilarity.toFixed(2)}%, Word=${wordSimilarity.toFixed(2)}%, Final=${finalSimilarity.toFixed(2)}%, Numbers Changed=${numberDifferences.length}`);
  
  return {
    similarity: Math.round(finalSimilarity * 100) / 100,
    characterSimilarity: Math.round(charSimilarity * 100) / 100,
    wordSimilarity: Math.round(wordSimilarity * 100) / 100,
    totalWords1: words1.length,
    totalWords2: words2.length,
    commonWords: commonWords.length,
    uniqueToVerified: uniqueToText1.slice(0, 50),
    uniqueToUploaded: uniqueToText2.slice(0, 50),
    hasSignificantDifferences: finalSimilarity < 80,
    potentialTampering: potentialTampering,
    numberDifferences: numberDifferences,
    differences: {
      addedWords: uniqueToText2.length,
      removedWords: uniqueToText1.length,
      modifiedPercentage: Math.round((1 - finalSimilarity / 100) * 100)
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
  let verifiedFileSizeBytes = null;
  let uploadedFileSizeBytes = null;
  const startTime = Date.now();
  
  try {
    // Download verified file from IPFS
    verifiedFilePath = await downloadFromIPFS(ipfsCid, tempDir);
    
    // Compute raw file sizes for metrics
    try {
      const [verifiedStats, uploadedStats] = await Promise.all([
        fs.stat(verifiedFilePath),
        fs.stat(uploadedFilePath)
      ]);
      verifiedFileSizeBytes = verifiedStats.size;
      uploadedFileSizeBytes = uploadedStats.size;
    } catch (sizeError) {
      console.warn('Failed to compute file sizes for comparison metrics:', sizeError.message);
    }
    
    // Compare the files
    const result = await compareCredentialFiles(verifiedFilePath, uploadedFilePath);
    const durationMs = Date.now() - startTime;
    const accuracy = typeof result.ocrComparison?.similarity === 'number'
      ? result.ocrComparison.similarity
      : undefined;

    logMetric({
      name: 'Pipeline_OCRComparisonWithIPFS',
      durationMs,
      inputSize: (result.verifiedText ? result.verifiedText.length : 0) +
                 (result.uploadedText ? result.uploadedText.length : 0),
      accuracy,
      extra: {
        ipfsCid,
        overallStatus: result.overallStatus,
        verified_file_size_bytes: verifiedFileSizeBytes,
        uploaded_file_size_bytes: uploadedFileSizeBytes
      }
    });
    
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
    const durationMs = Date.now() - startTime;
    logMetric({
      name: 'Pipeline_OCRComparisonWithIPFS',
      durationMs,
      extra: {
        ipfsCid,
        error: error.message,
        verified_file_size_bytes: verifiedFileSizeBytes,
        uploaded_file_size_bytes: uploadedFileSizeBytes
      }
    });
    
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
  console.log('\n\n=== AI-Enhanced Credential Comparison Started ===');
  console.log('Parameters:', { ipfsCid, uploadedFilePath, tempDir, dbCredentialType });
  const startTime = Date.now();
  
  // Helper to send progress updates
  const updateProgress = (message, percent) => {
    console.log(`[${percent}%] ${message}`);
    if (progressCallback) progressCallback(message, percent);
  };
  
  let verifiedFilePath = null;
  let verifiedFileSizeBytes = null;
  let uploadedFileSizeBytes = null;
  
  try {
    // Step 1: Download verified file from IPFS
    updateProgress('Downloading verified credential from IPFS...', 10);
    verifiedFilePath = await downloadFromIPFS(ipfsCid, tempDir);
    updateProgress('Verified credential downloaded', 20);
    
    // Compute raw file sizes for metrics (verified from IPFS and uploaded file)
    try {
      const [verifiedStats, uploadedStats] = await Promise.all([
        fs.stat(verifiedFilePath),
        fs.stat(uploadedFilePath)
      ]);
      verifiedFileSizeBytes = verifiedStats.size;
      uploadedFileSizeBytes = uploadedStats.size;
    } catch (sizeError) {
      console.warn('Failed to compute file sizes for AI-enhanced comparison metrics:', sizeError.message);
    }
    
    // Step 2: AI Visual Analysis (Gemini supports PDFs directly!)
    updateProgress('Starting AI visual analysis with Gemini 2.0...', 25);
    
    // Analyze verified credential type
    updateProgress('  AI analyzing verified credential type...', 30);
    const verifiedAnalysis = await geminiService.analyzeCredentialType(verifiedFilePath);
    updateProgress('  Verified credential analyzed', 40);
    
    // Analyze uploaded credential type
    updateProgress('  AI analyzing uploaded credential type...', 45);
    const uploadedAnalysis = await geminiService.analyzeCredentialType(uploadedFilePath);
    updateProgress('  Uploaded credential analyzed', 55);
    
    // Compare both credentials visually
    updateProgress('  AI comparing credentials visually...', 60);
    const visualComparison = await geminiService.compareCredentialImages(
      verifiedFilePath,
      uploadedFilePath
    );
    updateProgress('  Visual comparison completed', 70);
    
    // Detect authenticity markers
    updateProgress('  AI detecting authenticity markers...', 75);
    const verifiedMarkers = await geminiService.detectAuthenticityMarkers(verifiedFilePath);
    const uploadedMarkers = await geminiService.detectAuthenticityMarkers(uploadedFilePath);
    updateProgress('  Authenticity markers detected', 80);
    
    // Check if AI analysis was successful
    if (!verifiedAnalysis.success || !uploadedAnalysis.success || !visualComparison.success) {
      // Check if quota was exhausted
      const quotaExhausted = verifiedAnalysis.quotaExhausted || uploadedAnalysis.quotaExhausted || visualComparison.quotaExhausted;
      
      if (quotaExhausted) {
        updateProgress('Gemini AI quota exhausted - using OCR-only mode...', 85);
        console.log('   NOTICE: Gemini AI free tier quota has been exhausted.');
        console.log('   The comparison will continue using OCR-only mode.');
        console.log('   Free tier resets daily. Check: https://aistudio.google.com/');
      } else {
        updateProgress('AI analysis failed, falling back to OCR-only...', 85);
        if (!verifiedAnalysis.success) {
          console.log('   Verified analysis error:', verifiedAnalysis.error);
        }
        if (!uploadedAnalysis.success) {
          console.log('   Uploaded analysis error:', uploadedAnalysis.error);
        }
        if (!visualComparison.success) {
          console.log('   Visual comparison error:', visualComparison.error);
        }
      }
      
      // Fallback to OCR-only comparison
      const ocrResult = await compareCredentialFiles(verifiedFilePath, uploadedFilePath, dbCredentialType);
      
      // Add quota warning to result if applicable
      if (quotaExhausted) {
        ocrResult.quotaWarning = 'Gemini AI free tier quota exhausted. Comparison completed using OCR-only mode. AI features will be available after quota resets (usually daily).';
      }
      
      const durationMs = Date.now() - startTime;
      const accuracy = typeof ocrResult.ocrComparison?.similarity === 'number'
        ? ocrResult.ocrComparison.similarity
        : undefined;

      logMetric({
        name: 'Pipeline_AIEnhancedComparison',
        durationMs,
        inputSize: (ocrResult.verifiedText ? ocrResult.verifiedText.length : 0) +
                   (ocrResult.uploadedText ? ocrResult.uploadedText.length : 0),
        accuracy,
        extra: {
          mode: 'ocr-fallback',
          ipfsCid,
          quotaExhausted,
          overallStatus: ocrResult.overallStatus,
          verified_file_size_bytes: verifiedFileSizeBytes,
          uploaded_file_size_bytes: uploadedFileSizeBytes
        }
      });
      
      return ocrResult;
    }
    
    updateProgress('AI visual analysis completed successfully!', 82);
    
    // Extract credential types from AI analysis
    const verifiedTypeRaw = dbCredentialType || verifiedAnalysis.analysis.documentType;
    const uploadedTypeRaw = uploadedAnalysis.analysis.documentType;
    const verifiedType = normalizeCredentialType(verifiedTypeRaw);
    const uploadedType = normalizeCredentialType(uploadedTypeRaw);
    
    console.log('Credential Types:');
    console.log('   Verified:', verifiedType, '(confidence:', verifiedAnalysis.analysis.confidence + ')');
    console.log('   Uploaded:', uploadedType, '(confidence:', uploadedAnalysis.analysis.confidence + ')');
    console.log('   AI Match:', visualComparison.comparison?.sameCredentialType ? 'Same type' : 'Different types');
    
    const exactMatch = visualComparison.comparison.exactSameDocument;
    const matchConfidence = visualComparison.comparison.matchConfidence;
    
    // Step 3: OCR Text Extraction
    updateProgress('Extracting text with OCR (Tesseract.js)...', 85);
    const verifiedText = await extractTextFromImage(verifiedFilePath);
    updateProgress('  Verified credential text extracted', 90);
    const uploadedText = await extractTextFromImage(uploadedFilePath);
    updateProgress('  Uploaded credential text extracted', 93);
    
    // Step 4: Text Comparison
    updateProgress('Comparing text content...', 95);
    const textComparison = compareTexts(verifiedText, uploadedText);
    updateProgress('Text comparison completed', 97);
    
    // Combine AI visual analysis with OCR text comparison
    updateProgress('Generating comprehensive report...', 98);
    
    // Determine overall match status
    // PRACTICAL approach for real-world use (photos of physical credentials)
    let overallStatus = 'authentic';
    let statusMessage = 'Files appear to be authentic and match';
    
    // Only flag as fraudulent if SEVERE tampering detected
    // Don't rely solely on AI recommendation which can be overly strict
    if (visualComparison.comparison.tamperingIndicators.severity === 'Severe') {
      overallStatus = 'fraudulent';
      statusMessage = 'ALERT: Severe tampering detected - critical fields modified';
    } else if (textComparison.similarity < 60) {
      // Very low text similarity = likely different documents
      overallStatus = 'fraudulent';
      statusMessage = 'ALERT: Content does not match - different documents';
    } else if (textComparison.similarity < 75 ||
               visualComparison.comparison.tamperingIndicators.severity === 'Moderate') {
      overallStatus = 'suspicious';
      statusMessage = 'Warning: Some differences detected - manual review recommended';
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
    
    updateProgress('Comparison complete!', 100);
    console.log('\n=== AI-Enhanced Comparison Complete ===\n');
    
    const durationMs = Date.now() - startTime;
    const accuracy = typeof textComparison.similarity === 'number'
      ? textComparison.similarity
      : undefined;

    logMetric({
      name: 'Pipeline_AIEnhancedComparison',
      durationMs,
      inputSize: (verifiedText ? verifiedText.length : 0) +
                 (uploadedText ? uploadedText.length : 0),
      accuracy,
      extra: {
        mode: 'ai',
        ipfsCid,
        overallStatus,
        matchConfidence,
        authenticityScore: visualComparison.comparison.authenticityMarkers.overallAuthenticityScore,
        tamperingSeverity: visualComparison.comparison.tamperingIndicators.severity,
        verified_file_size_bytes: verifiedFileSizeBytes,
        uploaded_file_size_bytes: uploadedFileSizeBytes
      }
    });
    
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
    console.error('AI-Enhanced comparison error:', error);
    console.error('Error stack:', error.stack);
    
    const durationMs = Date.now() - startTime;
    logMetric({
      name: 'Pipeline_AIEnhancedComparison',
      durationMs,
      extra: {
        mode: 'error',
        ipfsCid,
        error: error.message,
        verified_file_size_bytes: verifiedFileSizeBytes,
        uploaded_file_size_bytes: uploadedFileSizeBytes
      }
    });
    
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