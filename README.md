# verified

MyVerifiED is a full-stack blockchain credential verification platform designed to enable educational institutions to issue tamper-resistant digital credentials and allow third parties to independently verify their authenticity.

The system integrates the Polygon network for immutable credential recording, IPFS for decentralized file storage, and AI-assisted document analysis for enhanced verification accuracy.

1. System Overview
MyVerifiED addresses the limitations of traditional credential verification systems, which rely on centralized databases vulnerable to tampering, data loss, and administrative inefficiencies.
The platform introduces:
 - On-chain credential registration
 - Off-chain decentralized document storage
 - Multi-layer verification mechanisms
 - AI-assisted document analysis
 - Role-based access control

The system supports three primary user roles:
 - Institutions (credential issuers)
 - Students (credential holders)
 - Verifiers (employers, agencies, or third parties)

2. Core Features
 2.1 Institutional Capabilities
  - Blockchain Credential Issuance
      Credentials are uploaded, stored on IPFS, and registered on the Polygon Mainnet through a deployed smart contract.
  
  - Wallet-Based Authorization
      Secure transaction signing through MetaMask integration.
  
  - Student Record Management
      Bulk CSV import and manual student registration.
  
  - Institution Address History Tracking
      Maintains historical wallet addresses to preserve verification continuity after wallet updates.
  
  - Analytics Dashboard
      Issuance statistics with filtering by date and academic program.

  2.2 Student Capabilities
  - Digital Credential Portfolio
      Centralized dashboard displaying all issued credentials.
  
  - Verification Access Code Generation
      Temporary shareable codes for controlled third-party access.
  
  - Credential Download
      Access to original documents stored via IPFS gateway.
  
  - Account Management
      Profile management and linked credential oversight.
  
  2.3 Verifier Capabilities
    MyVerifiED provides three independent verification mechanisms:
  
   - Access Code Verification
      Validation using student-generated secure codes.
  
   - File Upload Verification
      AI-assisted OCR extraction and integrity comparison.
  
   - Direct Blockchain Lookup
      Credential verification via on-chain credential ID query.

3. System Architecture
   Backend Architecture:
    - Runtime Environment: Node.js
    - Framework: Express.js
    - Database: MySQL
    - Blockchain Integration: Ethers.js
    - OCR Engine: Tesseract
    - AI Processing: Google Gemini

   Frontend Architecture
    - Framework: React (v19)
    - Routing: React Router
    - UI Framework: React Bootstrap
    - Blockchain Wallet Integration: MetaMask
    - State Management: React hooks and context

4. Installation and Setup
   4.1 Prerequisites
    - Node.js 16 or later
    - MySQL 8.0 or later
    - MetaMask browser extension
    - POL tokens for gas fees on Polygon

   4.2 Installation Procedure
   
    1. Clone the Repository:
       'git clone https://github.com/yourusername/verified.git'
       'cd verified'
    
    2. Install Dependencies:
        'npm install'
       
    3. Database Initialization
        'mysql -u root -p < verified_db.sql'
       
    4. Configure Environment Variables:
      Create a .env file based on .env.example and provide:
       - Database credentials
       - Polygon RPC endpoint
       - Pinata API credentials
       - Gemini API key
       - Smart contract address

    5. Start the Application:
      Development mode:
          'npm run dev'

      Production mode:
          'npm run build'
          'npm start'


MyVerifiED provides a decentralized, secure, and extensible framework for academic credential issuance and verification. By integrating blockchain immutability, decentralized storage, and AI-assisted validation, the system offers a practical solution to credential fraud while maintaining scalability and institutional usability.
