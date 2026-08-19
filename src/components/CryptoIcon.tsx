import React, { useState } from 'react';

export const getCryptoIcon = (symbol: string): string => {
  const icons: Record<string, string> = {
    'BTC': '₿',
    'ETH': 'Ξ',
    'USDT': '₮',
    'BNB': 'BNB',
    'SOL': '◎',
    'USDC': '$',
    'XRP': '✕',
    'TRX': 'TRX',
    'DOGE': 'Ð',
    'ADA': '₳',
    'AVAX': '🔺',
    'DOT': '●',
    'MATIC': '🟣',
    'LINK': '🔗',
    'ZEC': 'ⓩ',
    'NEAR': 'Ⓝ',
  };
  return icons[symbol.toUpperCase()] || symbol.slice(0, 1).toUpperCase();
};

export const CryptoIcon = ({ symbol, name, color }: { symbol: string, name: string, color?: string }) => {
  const [error, setError] = useState(false);
  const lowerSymbol = symbol.toLowerCase();

  // Specific Overrides for cryptos that aren't in the generic CDN
  if (lowerSymbol === 'near') {
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs"
        style={{ backgroundColor: color || '#00d084', color: '#000' }}
      >
        <svg viewBox="0 0 250 250" className="w-full h-full p-[6px]">
          <path fill="currentColor" d="M165.7 172.9L84.3 54.4H47.1v141.2h31.4v-118.5l81.4 118.5h37.2V54.4h-31.4v118.5z"/>
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-[11px] shadow-xs shrink-0"
        style={{ backgroundColor: color || '#3b82f6' }}
      >
        {getCryptoIcon(symbol)}
      </div>
    );
  }

  return (
    <img 
      src={`https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/${lowerSymbol}.svg`} 
      alt={name}
      className="w-8 h-8 rounded-full shrink-0 shadow-xs"
      onError={() => setError(true)}
    />
  );
};
