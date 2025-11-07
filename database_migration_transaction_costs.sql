-- Migration: Create transaction_costs table for tracking blockchain transaction costs
-- This stores the actual costs at the time of transaction for accurate historical records
-- Separate table follows normalization principles and allows for better data management

CREATE TABLE IF NOT EXISTS transaction_costs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  credential_id INT NOT NULL,
  transaction_hash VARCHAR(66) NOT NULL,
  institution_id INT NOT NULL,
  
  -- Blockchain transaction details
  gas_used BIGINT NOT NULL,
  gas_price_gwei DECIMAL(20, 9) NOT NULL,
  gas_cost_pol DECIMAL(20, 18) NOT NULL,
  
  -- Currency conversion at time of transaction
  pol_price_usd DECIMAL(10, 6) NOT NULL,
  pol_price_php DECIMAL(10, 4) NOT NULL,
  
  -- Calculated costs in fiat currencies
  gas_cost_usd DECIMAL(10, 6) NOT NULL,
  gas_cost_php DECIMAL(10, 4) NOT NULL,
  
  -- Timestamps
  tx_timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  UNIQUE KEY unique_transaction (transaction_hash),
  FOREIGN KEY (credential_id) REFERENCES credential(id) ON DELETE CASCADE,
  FOREIGN KEY (institution_id) REFERENCES institution(id) ON DELETE CASCADE,
  INDEX idx_credential_id (credential_id),
  INDEX idx_institution_id (institution_id),
  INDEX idx_transaction_hash (transaction_hash),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;