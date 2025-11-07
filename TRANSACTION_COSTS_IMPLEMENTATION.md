# Transaction Costs Implementation Guide

## Overview
This implementation adds accurate historical transaction cost tracking for credential issuance on the Polygon blockchain. Costs are stored at the time of transaction to prevent fluctuations due to cryptocurrency price changes.

## Database Schema

### New Table: `transaction_costs`

Stores blockchain transaction costs with currency conversions at the time of transaction.

**Columns:**
- `id` - Primary key
- `credential_id` - Foreign key to credential table
- `transaction_hash` - Blockchain transaction hash (unique)
- `institution_id` - Institution that paid for the transaction
- `gas_used` - Gas units consumed
- `gas_price_gwei` - Gas price in Gwei at transaction time
- `gas_cost_pol` - Total cost in POL tokens
- `pol_price_usd` - POL price in USD at transaction time
- `pol_price_php` - POL price in PHP at transaction time
- `gas_cost_usd` - Gas cost in USD at transaction time
- `gas_cost_php` - Gas cost in PHP at transaction time
- `tx_timestamp` - Blockchain transaction timestamp
- `created_at` - Record creation timestamp

**Indexes:**
- Unique index on `transaction_hash`
- Foreign keys with CASCADE delete
- Indexes on `credential_id`, `institution_id`, `created_at`

## Implementation Steps

### 1. Run Database Migration

Execute the SQL migration file:
```bash
mysql -u your_username -p your_database < database_migration_transaction_costs.sql
```

Or run directly in your MySQL client:
```sql
source database_migration_transaction_costs.sql;
```

### 2. How It Works

#### A. Automatic Cost Saving (New Credentials)
When a credential is issued:
1. Transaction is sent to blockchain
2. After confirmation, credential is uploaded via `/api/institution/upload-credential-after-blockchain`
3. Backend automatically:
   - Fetches current POL price from CoinGecko
   - Retrieves gas usage from blockchain transaction receipt
   - Calculates costs in POL, USD, and PHP
   - Saves to `transaction_costs` table
4. Costs are now permanently stored with historical accuracy

#### B. Transaction History Display
When viewing transaction history:
1. Query joins `credential` with `transaction_costs` table
2. If costs exist in database → use stored values (accurate historical data)
3. If costs missing (old transactions) → fetch from blockchain with current prices (marked as estimated)

### 3. Benefits

✅ **Historical Accuracy** - Costs reflect actual prices at transaction time
✅ **No Fluctuations** - Total costs remain constant regardless of current POL price
✅ **Accounting Ready** - Accurate financial records for reporting
✅ **Performance** - No need to fetch blockchain data for every view
✅ **Normalized Design** - Separate table follows database best practices

### 4. API Endpoints

#### Get Transaction History
```
GET /api/institution/transaction-history/:institutionId
```

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": 123,
      "student_name": "John Doe",
      "credential_type": "Diploma",
      "transaction_hash": "0x...",
      "gas_used": 150000,
      "gas_price_gwei": 35.5,
      "gas_cost_pol": 0.005325,
      "pol_price_usd": 0.1634,
      "pol_price_php": 9.15,
      "gas_cost_usd": 0.000870,
      "gas_cost_php": 0.0487,
      "transaction_date": "2024-11-07T10:30:00Z"
    }
  ],
  "pol_price_usd": 0.1634,
  "pol_price_php": 9.15
}
```

### 5. Frontend Display

The `TransactionHistoryTable` component shows:
- Summary cards with total transactions and costs
- Detailed table with per-transaction breakdown
- Links to view transactions on PolygonScan
- Responsive design for mobile devices

### 6. Future Enhancements

**Optional: Backfill Existing Transactions**
If you want to populate costs for existing credentials:

```javascript
// Create a backfill script
const backfillTransactionCosts = async () => {
  // 1. Fetch all credentials with transaction_hash but no cost record
  // 2. For each transaction:
  //    - Fetch gas data from blockchain
  //    - Get historical POL price (if available) or use current
  //    - Save to transaction_costs table
};
```

### 7. Monitoring

Check transaction cost records:
```sql
-- View all transaction costs
SELECT * FROM transaction_costs ORDER BY created_at DESC LIMIT 10;

-- Check total costs by institution
SELECT 
  i.institution_name,
  COUNT(*) as total_transactions,
  SUM(tc.gas_cost_pol) as total_pol,
  SUM(tc.gas_cost_usd) as total_usd,
  SUM(tc.gas_cost_php) as total_php
FROM transaction_costs tc
JOIN institution i ON tc.institution_id = i.id
GROUP BY i.id;

-- Find credentials without cost records
SELECT c.id, c.transaction_id 
FROM credential c
LEFT JOIN transaction_costs tc ON c.id = tc.credential_id
WHERE c.transaction_id IS NOT NULL 
  AND tc.id IS NULL;
```

## Files Modified

1. **database_migration_transaction_costs.sql** - Database schema
2. **src/queries/academicInstitutionQueries.js** - Added `insertTransactionCost` and updated `getTransactionHistory`
3. **src/routes/institutionRoutes.js** - Added cost saving logic to credential upload
4. **src/components/institution/TransactionHistoryTable.js** - Frontend component
5. **src/components/institution/TransactionHistoryTable.css** - Styling
6. **src/components/institution/AcademicInstitution.js** - Added Transactions tab
7. **src/services/institutionApiService.js** - Added `fetchTransactionHistory`

## Support

For issues or questions, check:
- Database connection and permissions
- Blockchain RPC URL configuration
- CoinGecko API rate limits
- Transaction hash format (must be 0x-prefixed hex)
