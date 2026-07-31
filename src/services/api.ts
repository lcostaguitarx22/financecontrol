export interface LivePrices {
  usdToBrl: number;
  cryptos: Record<string, { usd: number; brl: number; change24h: number }>;
}

/**
 * Busca a cotação do Dólar em tempo real (AwesomeAPI)
 */
export async function fetchUSDBRL(): Promise<number> {
  try {
    const res = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL');
    if (!res.ok) throw new Error('Falha ao buscar Dólar');
    const data = await res.json();
    return parseFloat(data.USDBRL.bid);
  } catch (error) {
    console.error('Erro na cotação do Dólar:', error);
    return 5.0; // Valor fallback de segurança
  }
}

/**
 * Busca cotações de criptomoedas em Dólar e Real (Binance)
 * @param symbols Ex: ['BTC', 'ETH', 'SOL']
 */
export async function fetchCryptoPrices(symbols: string[]): Promise<Record<string, { usd: number; brl: number; change24h: number }>> {
  if (symbols.length === 0) return {};
  
  try {
    const result: Record<string, { usd: number; brl: number; change24h: number }> = {};
    const usdToBrl = await fetchUSDBRL();
    
    // Binance API não permite consulta em lote facilmente pela URL simples sem formato específico,
    // então faremos consultas paralelas para cada símbolo pareado com USDT
    const promises = symbols.map(async (sym) => {
      const upperSym = sym.toUpperCase();
      // Casos especiais como USDT não precisam buscar o próprio par USDTUSDT, podemos assumir 1.0
      if (upperSym === 'USDT' || upperSym === 'USDC') {
        result[upperSym] = { usd: 1.0, brl: usdToBrl, change24h: 0 };
        return;
      }

      try {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${upperSym}USDT`);
        if (res.ok) {
          const data = await res.json();
          const usdPrice = parseFloat(data.lastPrice);
          const change24h = parseFloat(data.priceChangePercent);
          result[upperSym] = {
            usd: usdPrice,
            brl: usdPrice * usdToBrl,
            change24h: change24h
          };
        }
      } catch (err) {
        console.error(`Erro ao buscar Binance para ${upperSym}:`, err);
      }
    });

    await Promise.all(promises);
    return result;
  } catch (error) {
    console.error('Erro nas cotações de Cripto (Binance):', error);
    return {};
  }
}
