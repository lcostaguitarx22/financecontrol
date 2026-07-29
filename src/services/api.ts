export interface LivePrices {
  usdToBrl: number;
  cryptos: Record<string, { usd: number; brl: number }>;
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
 * Busca cotações de criptomoedas em Dólar e Real (CryptoCompare)
 * @param symbols Ex: ['BTC', 'ETH', 'SOL']
 */
export async function fetchCryptoPrices(symbols: string[]): Promise<Record<string, { usd: number; brl: number }>> {
  if (symbols.length === 0) return {};
  
  try {
    const joinedSymbols = symbols.map(s => s.toUpperCase()).join(',');
    const url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${joinedSymbols}&tsyms=USD,BRL`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Falha ao buscar criptos');
    const data = await res.json();
    
    // Formatar o retorno para lowerCase nas chaves de preço
    const result: Record<string, { usd: number; brl: number }> = {};
    for (const sym of symbols) {
      const upperSym = sym.toUpperCase();
      if (data[upperSym]) {
        result[upperSym] = {
          usd: data[upperSym].USD || 0,
          brl: data[upperSym].BRL || 0,
        };
      }
    }
    
    return result;
  } catch (error) {
    console.error('Erro nas cotações de Cripto:', error);
    return {};
  }
}
