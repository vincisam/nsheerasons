{/* Replace the old string-rendering block with this structured UI */}
{result && typeof result === 'object' && (
  <div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '5px' }}>
    <h3 style={{ margin: '0 0 10px 0' }}>Chart Analysis: {result.assetName}</h3>
    
    <p>
      <strong>Trend:</strong>{' '}
      <span style={{ textTransform: 'capitalize' }}>{result.trendDirection}</span>
    </p>
    
    <p>
      <strong>EMA Crossover:</strong>{' '}
      {result.emaCrossoverDetected ? 'Detected ✅' : 'None ❌'}
    </p>
    
    <h4 style={{ margin: '15px 0 5px 0' }}>Key Price Levels:</h4>
    <ul style={{ margin: 0, paddingLeft: '20px' }}>
      {result.keyPriceLevels.length > 0 ? (
        result.keyPriceLevels.map((price, index) => (
          <li key={index}>{price}</li>
        ))
      ) : (
        <li>No clear levels detected</li>
      )}
    </ul>
  </div>
)}n