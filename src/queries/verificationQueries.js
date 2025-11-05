const connection = require('../config/database');

/**
 * Fetch credential data for verification (single access code)
 * @param {string} accessCode - The access code to verify
 * @param {function} callback - Callback function
 */
const getCredentialData = (accessCode, callback) => {
  const query = `
    SELECT 
      c.id,
      c.ipfs_cid,
      c.blockchain_id,
      c.status,
      c.created_at AS date_issued,
      COALESCE(ct.type_name, c.custom_type) AS credential_type,
      CONCAT(s.first_name, ' ', s.last_name) AS recipient_name,
      s.student_id,
      inst.institution_name AS issuer_name,
      inst.public_address AS issuer_public_address,
      (
        SELECT GROUP_CONCAT(ia.public_address SEPARATOR ',')
        FROM institution_addresses ia
        WHERE ia.institution_id = inst.id
      ) AS institution_addresses,
      ca.access_code,
      c.program_id,
      p.program_name,
      p.program_code
    FROM credential c
    LEFT JOIN credential_types ct ON c.credential_type_id = ct.id
    JOIN student s ON c.owner_id = s.id
    JOIN institution inst ON c.sender_id = inst.id
    LEFT JOIN program p ON c.program_id = p.id
    JOIN credential_access ca ON ca.credential_id = c.id
    WHERE ca.access_code = ?
      AND ca.is_active = 1
      AND c.status IN ('blockchain_verified', 'uploaded')
      AND c.status != 'deleted'
    LIMIT 1
  `;

  connection.query(query, [accessCode], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0] || null);
  });
};

/**
 * Fetch multiple credentials for multi-access code verification
 * @param {string} accessCode - The multi-access code to verify
 * @param {function} callback - Callback function
 */
const getMultiCredentialData = (accessCode, callback) => {
  const query = `
    SELECT 
      c.id,
      c.ipfs_cid,
      c.blockchain_id,
      c.status,
      c.created_at AS date_issued,
      COALESCE(ct.type_name, c.custom_type) AS credential_type,
      CONCAT(s.first_name, ' ', s.last_name) AS recipient_name,
      s.student_id,
      inst.institution_name AS issuer_name,
      inst.public_address AS issuer_public_address,
      (
        SELECT GROUP_CONCAT(ia.public_address SEPARATOR ',')
        FROM institution_addresses ia
        WHERE ia.institution_id = inst.id
      ) AS institution_addresses,
      mac.access_code,
      c.program_id,
      p.program_name,
      p.program_code
    FROM multi_access_code mac
    INNER JOIN multi_access_code_credentials macc ON macc.multi_access_code_id = mac.id
    INNER JOIN credential c ON c.id = macc.credential_id
    LEFT JOIN credential_types ct ON c.credential_type_id = ct.id
    JOIN student s ON c.owner_id = s.id
    JOIN institution inst ON c.sender_id = inst.id
    LEFT JOIN program p ON c.program_id = p.id
    WHERE mac.access_code = ?
      AND mac.is_active = 1
      AND mac.is_deleted = 0
      AND c.status IN ('blockchain_verified', 'uploaded')
      AND c.status != 'deleted'
    ORDER BY c.created_at DESC
  `;

  connection.query(query, [accessCode], (err, results) => {
    if (err) return callback(err);
    callback(null, results || []);
  });
};


/**
 * Get credential by ID for file comparison
 * @param {number} credentialId - The credential ID
 * @param {function} callback - Callback function
 */
const getCredentialById = (credentialId, callback) => {
  const query = `
    SELECT 
      c.id,
      c.ipfs_cid,
      c.blockchain_id,
      c.status,
      c.created_at AS date_issued,
      COALESCE(ct.type_name, c.custom_type) AS credential_type,
      CONCAT(s.first_name, ' ', s.last_name) AS recipient_name,
      s.student_id,
      inst.institution_name AS issuer_name,
      inst.public_address AS issuer_public_address,
      ca.access_code
    FROM credential c
    LEFT JOIN credential_types ct ON c.credential_type_id = ct.id
    JOIN student s ON c.owner_id = s.id
    JOIN institution inst ON c.sender_id = inst.id
    LEFT JOIN credential_access ca ON ca.credential_id = c.id AND ca.is_active = 1
    WHERE c.id = ?
      AND c.status IN ('blockchain_verified', 'uploaded')
      AND c.status != 'deleted'
    LIMIT 1
  `;

  connection.query(query, [credentialId], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0] || null);
  });
};

/**
 * Search credentials by extracted text content (for file-based verification)
 * Uses fuzzy matching to find potential matches
 * @param {string} extractedText - Text extracted from uploaded file
 * @param {string} credentialType - Identified credential type (optional)
 * @param {function} callback - Callback function
 */
const searchCredentialsByText = (extractedText, credentialType, callback) => {
  // Extract potential keywords from text
  const text = extractedText.toLowerCase();
  
  // Extract individual words (potential names, institutions, etc.)
  // Remove common words and keep meaningful keywords
  const commonWords = ['the', 'of', 'and', 'in', 'to', 'a', 'is', 'that', 'this', 'for', 'on', 'with', 'as', 'by', 'at', 'from', 'has', 'been', 'have', 'was', 'were', 'are'];
  const words = text
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/) // Split by whitespace
    .filter(word => word.length > 2 && !commonWords.includes(word)) // Filter out short words and common words
    .slice(0, 20); // Take first 20 meaningful words
  
  console.log('Extracted keywords for search:', words.join(', '));
  
  // Build dynamic WHERE clause for each keyword
  const keywordConditions = words.map(() => `
    (LOWER(s.first_name) LIKE ? OR
     LOWER(s.last_name) LIKE ? OR
     LOWER(CONCAT(s.first_name, ' ', s.last_name)) LIKE ? OR
     LOWER(inst.institution_name) LIKE ? OR
     LOWER(p.program_name) LIKE ? OR
     LOWER(s.student_id) LIKE ?)
  `).join(' OR ');
  
  // Build relevance score calculation
  const relevanceScoreCalc = words.map(() => `
    CASE WHEN LOWER(CONCAT(s.first_name, ' ', s.last_name)) LIKE ? THEN 10 ELSE 0 END +
    CASE WHEN LOWER(inst.institution_name) LIKE ? THEN 8 ELSE 0 END +
    CASE WHEN LOWER(p.program_name) LIKE ? THEN 3 ELSE 0 END +
    CASE WHEN LOWER(s.student_id) LIKE ? THEN 5 ELSE 0 END
  `).join(' + ');
  
  const query = `
    SELECT 
      c.id,
      c.ipfs_cid,
      c.blockchain_id,
      c.status,
      c.created_at AS date_issued,
      COALESCE(ct.type_name, c.custom_type) AS credential_type,
      CONCAT(s.first_name, ' ', s.last_name) AS recipient_name,
      s.first_name,
      s.last_name,
      s.student_id,
      inst.institution_name AS issuer_name,
      inst.public_address AS issuer_public_address,
      (
        SELECT GROUP_CONCAT(ia.public_address SEPARATOR ',')
        FROM institution_addresses ia
        WHERE ia.institution_id = inst.id
      ) AS institution_addresses,
      c.program_id,
      p.program_name,
      p.program_code,
      (
        ${relevanceScoreCalc || '0'} +
        CASE WHEN LOWER(COALESCE(ct.type_name, c.custom_type)) LIKE ? THEN 5 ELSE 0 END
      ) AS relevance_score
    FROM credential c
    LEFT JOIN credential_types ct ON c.credential_type_id = ct.id
    JOIN student s ON c.owner_id = s.id
    JOIN institution inst ON c.sender_id = inst.id
    LEFT JOIN program p ON c.program_id = p.id
    WHERE c.status IN ('blockchain_verified', 'uploaded')
      AND c.status != 'deleted'
      AND (
        ${keywordConditions || '1=0'}
        ${credentialType ? 'OR LOWER(COALESCE(ct.type_name, c.custom_type)) LIKE ?' : ''}
      )
    ORDER BY relevance_score DESC, c.created_at DESC
    LIMIT 10
  `;
  
  // Build parameters array
  const params = [];
  
  // Add parameters for relevance score calculation
  words.forEach(word => {
    const pattern = `%${word}%`;
    params.push(pattern); // student name
    params.push(pattern); // institution
    params.push(pattern); // program
    params.push(pattern); // student_id
  });
  
  // Add credential type for relevance
  const typePattern = credentialType ? `%${credentialType.toLowerCase()}%` : '%';
  params.push(typePattern);
  
  // Add parameters for WHERE clause
  words.forEach(word => {
    const pattern = `%${word}%`;
    params.push(pattern); // first_name
    params.push(pattern); // last_name
    params.push(pattern); // full name
    params.push(pattern); // institution
    params.push(pattern); // program
    params.push(pattern); // student_id
  });
  
  // Add credential type for WHERE clause if provided
  if (credentialType) {
    params.push(typePattern);
  }
  
  console.log('Search query parameters count:', params.length);
  
  connection.query(query, params, (err, results) => {
    if (err) {
      console.error('Search query error:', err);
      return callback(err);
    }
    console.log('Search found', results?.length || 0, 'credentials');
    callback(null, results || []);
  });
};

/**
 * Search credentials using AI-extracted structured data
 * More accurate than text-based search
 * @param {object} searchParams - AI-extracted credential information
 * @param {function} callback - Callback function
 */
/**
 * Parse name in various formats and extract components
 * Handles: "Last, First Middle", "First Middle Last", "First Last"
 */
const parseNameComponents = (fullName) => {
  if (!fullName) return null;
  
  const name = fullName.trim();
  
  // Check if name contains comma (format: "Last, First Middle")
  if (name.includes(',')) {
    const parts = name.split(',').map(p => p.trim());
    const lastName = parts[0];
    const firstMiddle = parts[1] || '';
    const firstMiddleParts = firstMiddle.split(/\s+/).filter(p => p.length > 0);
    
    return {
      lastName: lastName,
      firstName: firstMiddleParts[0] || '',
      middleName: firstMiddleParts.slice(1).join(' ') || '',
      allParts: [lastName, ...firstMiddleParts].filter(p => p.length > 0)
    };
  } else {
    // Format: "First Middle Last" or "First Last"
    const parts = name.split(/\s+/).filter(p => p.length > 0);
    
    if (parts.length >= 3) {
      return {
        firstName: parts[0],
        middleName: parts.slice(1, -1).join(' '),
        lastName: parts[parts.length - 1],
        allParts: parts
      };
    } else if (parts.length === 2) {
      return {
        firstName: parts[0],
        middleName: '',
        lastName: parts[1],
        allParts: parts
      };
    } else {
      return {
        firstName: parts[0] || '',
        middleName: '',
        lastName: '',
        allParts: parts
      };
    }
  }
};

const searchCredentialsByAI = (searchParams, callback) => {
  console.log('AI-powered search with params:', searchParams);
  
  // If we have AI-extracted data, use precise matching
  if (searchParams.recipientName || searchParams.institutionName || searchParams.studentId) {
    const conditions = [];
    const params = [];
    
    // Build WHERE conditions based on available data
    if (searchParams.recipientName) {
      const parsedName = parseNameComponents(searchParams.recipientName);
      
      if (parsedName && parsedName.allParts.length > 0) {
        // Progressive search with fallback:
        // 1. Filter by last name (MUST match)
        // 2. Try to match first name with progressive fallback (full → partial → first word only)
        // 3. Search remaining words in middle name
        
        const nameConditions = [];
        
        // Step 1: MUST match last name
        if (parsedName.lastName) {
          nameConditions.push(`LOWER(s.last_name) LIKE ?`);
          params.push(`%${parsedName.lastName.toLowerCase()}%`);
        }
        
        // Step 2: Progressive first name matching with fallback
        // Extract first name parts (everything after comma, before last name)
        if (parsedName.firstName || parsedName.middleName) {
          // Combine firstName and middleName to get all parts after the comma
          const afterComma = [parsedName.firstName, parsedName.middleName]
            .filter(p => p && p.trim().length > 0)
            .join(' ');
          
          const firstNameParts = afterComma.split(/\s+/).filter(p => p.length > 0);
          
          if (firstNameParts.length > 0) {
            // Build progressive fallback conditions for first name
            // Try: full → remove last word → remove last word → ... → first word only
            const firstNameFallbacks = [];
            
            for (let i = firstNameParts.length; i >= 1; i--) {
              const nameCombination = firstNameParts.slice(0, i).join(' ').toLowerCase();
              firstNameFallbacks.push(`LOWER(s.first_name) LIKE ?`);
              params.push(`%${nameCombination}%`);
            }
            
            // At least one of these fallbacks must match (OR)
            nameConditions.push(`(${firstNameFallbacks.join(' OR ')})`);
            
            // Step 3: If there are remaining parts, search them in middle name
            // The remaining parts are those not matched by first_name
            // We'll search for any remaining words in middle_name
            if (firstNameParts.length > 1) {
              const middleNameFallbacks = [];
              
              // Try different combinations for middle name (from longest to shortest)
              for (let i = firstNameParts.length; i >= 2; i--) {
                const remainingParts = firstNameParts.slice(1, i).join(' ').toLowerCase();
                if (remainingParts.length > 0) {
                  middleNameFallbacks.push(`LOWER(s.middle_name) LIKE ?`);
                  params.push(`%${remainingParts}%`);
                }
              }
              
              // Middle name is optional - it can match OR be empty
              if (middleNameFallbacks.length > 0) {
                nameConditions.push(`(${middleNameFallbacks.join(' OR ')} OR s.middle_name IS NULL OR s.middle_name = '')`);
              }
            }
          }
        }
        
        // All conditions must be satisfied
        if (nameConditions.length > 0) {
          conditions.push(`(${nameConditions.join(' AND ')})`);
        }
      }
    }
    
    if (searchParams.institutionName) {
      conditions.push(`LOWER(inst.institution_name) LIKE ?`);
      params.push(`%${searchParams.institutionName.toLowerCase()}%`);
    }
    
    if (searchParams.studentId) {
      // Normalize student ID by removing special characters (hyphens, spaces, etc.)
      // This allows matching '202201084' with '2022-01084'
      const normalizedStudentId = searchParams.studentId.replace(/[-\s]/g, '');
      console.log('Searching for normalized student ID:', normalizedStudentId);
      conditions.push(`REPLACE(REPLACE(s.student_id, '-', ''), ' ', '') = ?`);
      params.push(normalizedStudentId);
    }
    
    if (searchParams.program) {
      conditions.push(`LOWER(p.program_name) LIKE ?`);
      params.push(`%${searchParams.program.toLowerCase()}%`);
    }
    
    if (searchParams.credentialType) {
      conditions.push(`LOWER(COALESCE(ct.type_name, c.custom_type)) LIKE ?`);
      params.push(`%${searchParams.credentialType.toLowerCase()}%`);
    }
    
    // If no conditions, return empty
    if (conditions.length === 0) {
      console.log('No search conditions available, falling back to text search');
      return searchCredentialsByText(searchParams.extractedText || '', searchParams.credentialType, callback);
    }
    
    const query = `
      SELECT 
        c.id,
        c.ipfs_cid,
        c.blockchain_id,
        c.status,
        c.created_at AS date_issued,
        COALESCE(ct.type_name, c.custom_type) AS credential_type,
        CONCAT(s.first_name, ' ', s.last_name) AS recipient_name,
        s.first_name,
        s.last_name,
        s.student_id,
        inst.institution_name AS issuer_name,
        inst.public_address AS issuer_public_address,
        (
          SELECT GROUP_CONCAT(ia.public_address SEPARATOR ',')
          FROM institution_addresses ia
          WHERE ia.institution_id = inst.id
        ) AS institution_addresses,
        c.program_id,
        p.program_name,
        p.program_code
      FROM credential c
      LEFT JOIN credential_types ct ON c.credential_type_id = ct.id
      JOIN student s ON c.owner_id = s.id
      JOIN institution inst ON c.sender_id = inst.id
      LEFT JOIN program p ON c.program_id = p.id
      WHERE c.status IN ('blockchain_verified', 'uploaded')
        AND c.status != 'deleted'
        AND (${conditions.join(' AND ')})
      ORDER BY c.created_at DESC
      LIMIT 10
    `;
    
    connection.query(query, params, (err, results) => {
      if (err) {
        console.error('AI search query error:', err);
        return callback(err);
      }
      console.log('AI search found', results?.length || 0, 'credentials');
      
      // If no exact matches found, try to find partial matches for better error messaging
      if (!results || results.length === 0) {
        console.log('No exact matches, searching for partial matches...');
        findPartialMatches(searchParams, callback);
      } else {
        callback(null, results || []);
      }
    });
    
  } else {
    // Fallback to text-based search
    console.log('No AI data available, using text-based search');
    searchCredentialsByText(searchParams.extractedText || '', searchParams.credentialType, callback);
  }
};

/**
 * Find partial matches to provide detailed error messages
 * Shows which fields matched and which didn't
 */
const findPartialMatches = (searchParams, callback) => {
  // Search with relaxed conditions (OR instead of AND)
  const conditions = [];
  const params = [];
  
  if (searchParams.recipientName) {
    const nameParts = searchParams.recipientName.toLowerCase().split(' ').filter(p => p.length > 0);
    if (nameParts.length > 0) {
      const nameConditions = nameParts.map(() => 
        `(LOWER(s.first_name) LIKE ? OR LOWER(s.last_name) LIKE ? OR LOWER(CONCAT(s.first_name, ' ', s.last_name)) LIKE ?)`
      ).join(' OR ');
      conditions.push(`(${nameConditions})`);
      nameParts.forEach(part => {
        const pattern = `%${part}%`;
        params.push(pattern, pattern, pattern);
      });
    }
  }
  
  if (searchParams.institutionName) {
    conditions.push(`LOWER(inst.institution_name) LIKE ?`);
    params.push(`%${searchParams.institutionName.toLowerCase()}%`);
  }
  
  if (searchParams.credentialType) {
    conditions.push(`LOWER(COALESCE(ct.type_name, c.custom_type)) LIKE ?`);
    params.push(`%${searchParams.credentialType.toLowerCase()}%`);
  }
  
  if (searchParams.program) {
    conditions.push(`LOWER(p.program_name) LIKE ?`);
    params.push(`%${searchParams.program.toLowerCase()}%`);
  }
  
  if (conditions.length === 0) {
    return callback(null, []);
  }
  
  const query = `
    SELECT 
      c.id,
      CONCAT(s.first_name, ' ', s.last_name) AS recipient_name,
      s.student_id,
      inst.institution_name AS issuer_name,
      COALESCE(ct.type_name, c.custom_type) AS credential_type,
      p.program_name
    FROM credential c
    LEFT JOIN credential_types ct ON c.credential_type_id = ct.id
    JOIN student s ON c.owner_id = s.id
    JOIN institution inst ON c.sender_id = inst.id
    LEFT JOIN program p ON c.program_id = p.id
    WHERE c.status IN ('blockchain_verified', 'uploaded')
      AND c.status != 'deleted'
      AND (${conditions.join(' OR ')})
    ORDER BY c.created_at DESC
    LIMIT 5
  `;
  
  connection.query(query, params, (err, results) => {
    if (err) {
      console.error('Partial match search error:', err);
      return callback(null, []);
    }
    
    console.log('Found', results?.length || 0, 'partial matches');
    if (results && results.length > 0) {
      console.log('Partial match #1:', {
        recipient_name: results[0].recipient_name,
        student_id: results[0].student_id,
        institution: results[0].issuer_name,
        credential_type: results[0].credential_type,
        program: results[0].program_name
      });
    }
    
    // Return empty array but with metadata about partial matches
    callback(null, [], results || []);
  });
};

/**
 * Fetch full credential details by credential IDs
 * Used to get complete data for partial matches
 */
const getCredentialsByIds = (credentialIds, callback) => {
  if (!credentialIds || credentialIds.length === 0) {
    return callback(null, []);
  }

  const query = `
    SELECT 
      c.id,
      c.ipfs_cid,
      c.blockchain_id,
      c.status,
      c.created_at AS date_issued,
      COALESCE(ct.type_name, c.custom_type) AS credential_type,
      CONCAT(s.first_name, ' ', s.last_name) AS recipient_name,
      s.first_name,
      s.last_name,
      s.student_id,
      inst.institution_name AS issuer_name,
      inst.public_address AS issuer_public_address,
      (
        SELECT GROUP_CONCAT(ia.public_address SEPARATOR ',')
        FROM institution_addresses ia
        WHERE ia.institution_id = inst.id
      ) AS institution_addresses,
      c.program_id,
      p.program_name,
      p.program_code
    FROM credential c
    LEFT JOIN credential_types ct ON c.credential_type_id = ct.id
    JOIN student s ON c.owner_id = s.id
    JOIN institution inst ON c.sender_id = inst.id
    LEFT JOIN program p ON c.program_id = p.id
    WHERE c.id IN (?)
  `;

  connection.query(query, [credentialIds], (err, results) => {
    if (err) {
      console.error('Error fetching credentials by IDs:', err);
      return callback(err);
    }
    callback(null, results || []);
  });
};

module.exports = {
  getCredentialData,
  getMultiCredentialData,
  getCredentialById,
  searchCredentialsByText,
  searchCredentialsByAI,
  getCredentialsByIds
};
