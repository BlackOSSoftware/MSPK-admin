const normalizeUpper = (value) => String(value ?? '').trim().toUpperCase();

const FOREX_CODES = new Set([
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD', 'INR', 'SGD', 'HKD', 'CNY', 'CNH',
  'SEK', 'NOK', 'DKK', 'ZAR', 'RUB', 'TRY', 'MXN', 'BRL', 'KRW', 'PLN', 'THB', 'IDR', 'MYR',
  'PHP', 'VND', 'TWD', 'SAR', 'AED', 'QAR', 'KWD', 'BHD', 'OMR', 'ILS',
]);

const INDEX_HINTS = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX', 'BANKEX', 'VIX', 'INDEX'];
const COMMODITY_REGEX = /(?:CRUDE|WTI|BRENT|USOIL|UKOIL|XAU|XAG|GOLD|SILVER|NATURAL GAS|NG|COPPER|ALUMINIUM|ZINC|LEAD|NICKEL|MENTHA|COTTON|GUAR|JEERA|SOY|WHEAT|CORN|SUGAR)/i;
const COMEX_EXCHANGES = new Set(['COMEX', 'NYMEX']);
const COMEX_SUBSEGMENTS = new Set(['ENERGY', 'METALS', 'AGRICULTURE', 'FUTURES_OTHER', 'RATES_FUTURES']);

const isCryptoLikeSymbol = (symbol = '') => {
  const normalized = normalizeUpper(symbol).replace(/(\.P|PERP)$/i, '');
  if (!normalized) return false;
  if (normalized.includes('USDT') || normalized.includes('USDC') || normalized.includes('BUSD')) return true;
  if (/BTC|ETH|SOL|XRP|DOGE|BNB|ADA|AVAX|MATIC|LTC|DOT|TRX/i.test(normalized) && normalized.endsWith('USD')) {
    return true;
  }
  return false;
};

const isForexPair = (symbol = '') => {
  const normalized = normalizeUpper(symbol).replace(/[^A-Z]/g, '');
  if (normalized.length !== 6) return false;
  const base = normalized.slice(0, 3);
  const quote = normalized.slice(3, 6);
  return FOREX_CODES.has(base) && FOREX_CODES.has(quote);
};

const isIndexLike = (symbol = '', name = '') => {
  const haystack = `${normalizeUpper(symbol)} ${normalizeUpper(name)}`;
  return INDEX_HINTS.some((hint) => haystack.includes(hint)) || haystack.includes('-INDEX');
};

export const getSegmentGroup = (symbolLike = {}) => {
  const segment = normalizeUpper(symbolLike?.segmentGroup || symbolLike?.segment);
  const exchange = normalizeUpper(symbolLike?.exchange);
  const subsegment = normalizeUpper(symbolLike?.subsegment);
  const symbol = normalizeUpper(symbolLike?.symbol || symbolLike?.sourceSymbol);
  const name = normalizeUpper(symbolLike?.name || symbolLike?.description);

  if (segment && ['EQUITY', 'FNO', 'COMMODITY', 'COMEX', 'CURRENCY', 'CRYPTO', 'INDICES'].includes(segment)) return segment;
  if (isCryptoLikeSymbol(symbol) || ['CRYPTO', 'BINANCE'].includes(segment) || ['CRYPTO', 'BINANCE'].includes(exchange)) return 'CRYPTO';
  const isComexSegment = COMEX_EXCHANGES.has(segment);
  const isComexExchange = COMEX_EXCHANGES.has(exchange);
  const isComexCommodityHint = COMEX_SUBSEGMENTS.has(subsegment) || COMMODITY_REGEX.test(`${symbol} ${name}`);
  if (isComexExchange || (isComexSegment && isComexCommodityHint)) return 'COMEX';
  if (COMMODITY_REGEX.test(`${symbol} ${name}`) && exchange && exchange !== 'MCX' && exchange !== 'NSE' && exchange !== 'BSE') return 'COMEX';
  if (
    ['COMMODITY', 'MCX'].includes(segment) ||
    ['MCX'].includes(exchange) ||
    ['ENERGY', 'METALS', 'AGRICULTURE'].includes(subsegment) ||
    COMMODITY_REGEX.test(`${symbol} ${name}`)
  ) return 'COMMODITY';
  if (
    ['CURRENCY', 'FOREX', 'CDS', 'BCD', 'FX', 'CUR'].includes(segment) ||
    ['FOREX', 'CDS', 'BCD'].includes(exchange) ||
    isForexPair(symbol)
  ) return 'CURRENCY';
  if (['INDICES', 'INDEX', 'NSEIX'].includes(segment) || exchange === 'NSEIX' || isIndexLike(symbol, name)) return 'INDICES';
  if (['FNO', 'FO', 'NFO', 'OPTIONS', 'OPTION', 'FUTURES'].includes(segment) || exchange === 'NFO') return 'FNO';
  if (['EQUITY', 'EQ', 'CM', 'NSE', 'BSE'].includes(segment) || ['NSE', 'BSE'].includes(exchange)) return 'EQUITY';
  if (isComexSegment && !isComexCommodityHint && !isComexExchange) return exchange || 'OTHER';
  return segment || exchange || 'OTHER';
};
