// fileName: TransactionHistoryTable.js
// Component for displaying credential issuance transaction history with gas costs

import React, { useState, useEffect } from 'react';
import { fetchTransactionHistory, fetchMaticPrice } from '../../services/institutionApiService';
import './TransactionHistoryTable.css';

function TransactionHistoryTable({ institutionId }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [polPrice, setPolPrice] = useState({ usd: 0, php: 0 });

  useEffect(() => {
    loadTransactionHistory();
    loadLivePolPrice();
    
    // Auto-refresh POL price every 5 minutes (same as dashboard)
    const priceInterval = setInterval(() => {
      loadLivePolPrice();
    }, 300000); // 5 minutes
    
    return () => clearInterval(priceInterval);
  }, [institutionId]);
  
  const loadLivePolPrice = async () => {
    try {
      const data = await fetchMaticPrice();
      if (data.success && data.priceUSD && data.pricePHP) {
        setPolPrice({
          usd: data.priceUSD,
          php: data.pricePHP
        });
      }
    } catch (err) {
      console.error('Failed to fetch live POL price:', err);
      // Keep existing price on error
    }
  };

  const loadTransactionHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTransactionHistory(institutionId);
      
      if (data.success) {
        setTransactions(data.transactions);
        // POL price is updated separately via loadLivePolPrice()
      } else {
        setError('Failed to load transaction history');
      }
    } catch (err) {
      console.error('Error loading transaction history:', err);
      setError('Failed to load transaction history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num, decimals = 6) => {
    if (num === null || num === undefined) return 'N/A';
    return Number(num).toFixed(decimals);
  };

  const openTransaction = (txHash) => {
    window.open(`https://polygonscan.com/tx/${txHash}`, '_blank');
  };

  const calculateTotalCosts = () => {
    const totals = transactions.reduce((acc, tx) => {
      if (tx.gas_cost_pol) acc.pol += tx.gas_cost_pol;
      if (tx.gas_cost_usd) acc.usd += tx.gas_cost_usd;
      if (tx.gas_cost_php) acc.php += tx.gas_cost_php;
      return acc;
    }, { pol: 0, usd: 0, php: 0 });
    
    return totals;
  };

  if (loading) {
    return (
      <div className="transaction-history-container">
        <div className="transaction-history-header">
          <h3>
            <i className="fas fa-receipt"></i> Transaction History
          </h3>
          <p className="header-subtitle">Blockchain transaction costs for credential issuance</p>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading transaction history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transaction-history-container">
        <div className="transaction-history-header">
          <h3>
            <i className="fas fa-receipt"></i> Transaction History
          </h3>
        </div>
        <div className="error-state">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
          <button onClick={loadTransactionHistory} className="retry-button">
            <i className="fas fa-redo"></i> Retry
          </button>
        </div>
      </div>
    );
  }

  const totals = calculateTotalCosts();

  return (
    <div className="transaction-history-container">
      <div className="transaction-history-header">
        <div>
          <h3>
            <i className="fas fa-receipt"></i> Transaction History
          </h3>
          <p className="header-subtitle">
            Blockchain transaction costs for credential issuance • POL Price: ${polPrice.usd.toFixed(4)} / ₱{polPrice.php.toFixed(2)}
          </p>
        </div>
        <button onClick={loadTransactionHistory} className="refresh-button" title="Refresh">
          <i className="fas fa-sync-alt"></i>
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-inbox"></i>
          <p>No transactions found</p>
          <span>Credential issuance transactions will appear here</span>
        </div>
      ) : (
        <>
          <div className="transaction-summary">
            <div className="summary-card">
              <span className="summary-label">Total Transactions</span>
              <span className="summary-value">{transactions.length}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Total Gas (POL)</span>
              <span className="summary-value">{formatNumber(totals.pol, 6)} POL</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Total Cost (USD)</span>
              <span className="summary-value">${formatNumber(totals.usd, 4)}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Total Cost (PHP)</span>
              <span className="summary-value">₱{formatNumber(totals.php, 2)}</span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Student</th>
                  <th>Credential Type</th>
                  <th>Program</th>
                  <th>Gas Used</th>
                  <th>Gas Price (Gwei)</th>
                  <th>Cost (POL)</th>
                  <th>Cost (USD)</th>
                  <th>Cost (PHP)</th>
                  <th>Transaction</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className={tx.error ? 'error-row' : ''}>
                    <td className="date-cell">{formatDate(tx.transaction_date)}</td>
                    <td className="student-cell">
                      <div className="student-info">
                        <span className="student-name">{tx.student_name}</span>
                        <span className="student-id">{tx.student_id}</span>
                      </div>
                    </td>
                    <td className="credential-cell">{tx.credential_type}</td>
                    <td className="program-cell">
                      {tx.program_name ? (
                        <div className="program-info">
                          <span className="program-name">{tx.program_name}</span>
                          {tx.program_code && <span className="program-code">({tx.program_code})</span>}
                        </div>
                      ) : (
                        <span className="no-program">—</span>
                      )}
                    </td>
                    <td className="gas-cell">
                      {tx.gas_used ? tx.gas_used.toLocaleString() : 'N/A'}
                    </td>
                    <td className="gas-price-cell">
                      {tx.gas_price_gwei ? formatNumber(tx.gas_price_gwei, 2) : 'N/A'}
                    </td>
                    <td className="cost-pol-cell">
                      {tx.gas_cost_pol ? formatNumber(tx.gas_cost_pol, 6) : 'N/A'}
                    </td>
                    <td className="cost-usd-cell">
                      {tx.gas_cost_usd ? `$${formatNumber(tx.gas_cost_usd, 4)}` : 'N/A'}
                    </td>
                    <td className="cost-php-cell">
                      {tx.gas_cost_php ? `₱${formatNumber(tx.gas_cost_php, 2)}` : 'N/A'}
                    </td>
                    <td className="transaction-cell">
                      {tx.transaction_hash ? (
                        <button
                          className="view-tx-button"
                          onClick={() => openTransaction(tx.transaction_hash)}
                          title="View on PolygonScan"
                        >
                          <i className="fas fa-external-link-alt"></i>
                          {tx.transaction_hash.substring(0, 8)}...
                        </button>
                      ) : (
                        <span className="no-tx">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default TransactionHistoryTable;
