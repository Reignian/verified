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
const searchCredentialsByAI = (searchParams, callback) => {
  console.log('AI-powered search with params:', searchParams);
  
  // If we have AI-extracted data, use precise matching
  if (searchParams.recipientName || searchParams.institutionName || searchParams.studentId) {
    const conditions = [];
    const params = [];
    
    // Build WHERE conditions based on available data
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
    
    if (searchParams.studentId) {
      conditions.push(`s.student_id = ?`);
      params.push(searchParams.studentId);
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
    
    console.log('Executing AI-powered search query with', params.length, 'parameters');
    
    connection.query(query, params, (err, results) => {
      if (err) {
        console.error('AI search query error:', err);
        return callback(err);
      }
      console.log('AI search found', results?.length || 0, 'credentials');
      if (results && results.length > 0) {
        console.log('First credential blockchain_id:', results[0].blockchain_id);
        console.log('First credential data:', JSON.stringify(results[0], null, 2));
      }
      callback(null, results || []);
    });
    
  } else {
    // Fallback to text-based search
    console.log('No AI data available, using text-based search');
    searchCredentialsByText(searchParams.extractedText || '', searchParams.credentialType, callback);
  }
};

module.exports = {
  getCredentialData,
  getMultiCredentialData,
  getCredentialById,
  searchCredentialsByText,
  searchCredentialsByAI
};
