export function formatPrice(price) {
  return parseFloat(price).toFixed(8);
}

export function calculateSpread(bid, ask) {
  return Math.abs(ask - bid);
}

export function formatMT4Symbol(symbol) {
  return symbol.toUpperCase().replace('-', '');
}