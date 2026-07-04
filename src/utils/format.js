// priceInUsdt etc. come back as 18-decimal wei-style strings
function formatWeiString(value, decimals = 18) {
  if (value === undefined || value === null) return null;
  try {
    const big = BigInt(value);
    const divisor = 10n ** BigInt(decimals);
    const whole = big / divisor;
    const fraction = big % divisor;
    const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 2);
    return Number(`${whole}.${fractionStr}`);
  } catch {
    return null;
  }
}

// grade is a string like "10 Gem Mint" — extract leading number for comparisons
function parseGradeNumber(gradeStr) {
  if (!gradeStr) return null;
  const match = String(gradeStr).match(/^(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function normalizeListing(raw) {
  return {
    tokenId: raw.tokenId,
    name: raw.name,
    set: raw.setName,
    cardNumber: raw.cardNumber,
    character: raw.pokemonName,
    ownerAddress: raw.ownerAddress,
    askPriceUSDT: formatWeiString(raw.askPriceInUSDT),
    fmvPriceUSD: raw.fmvPriceInUSD ? Number(raw.fmvPriceInUSD) : null,
    grade: raw.grade,
    gradeNumber: parseGradeNumber(raw.grade),
    gradingCompany: raw.gradingCompany,
    year: raw.year,
    url: null,
  };
}

function normalizePack(raw) {
  const priceUsdt = formatWeiString(raw.priceInUsdt);
  const evUsd = raw.expectedValueInUsd ? Number(raw.expectedValueInUsd) : null;
  return {
    slug: raw.slug,
    name: raw.name,
    stage: raw.stage,
    priceUsdt,
    evUsd,
    featuredCardFmvUsd: raw.featuredCardFmvInUsd ? Number(raw.featuredCardFmvInUsd) : null,
    evRatio: priceUsdt && evUsd ? Number((evUsd / priceUsdt).toFixed(2)) : null,
  };
}

function formatListingAlertText(listing) {
  const n = normalizeListing(listing);
  return [
    `🆕 New Listing Match`,
    ``,
    `📇 ${n.name || 'Unknown card'}`,
    n.set ? `📦 Set: ${n.set}` : null,
    n.character ? `🎴 ${n.character}` : null,
    n.grade ? `🏅 Grade: ${n.grade} (${n.gradingCompany || ''})` : null,
    n.askPriceUSDT !== null ? `💰 Ask: ${n.askPriceUSDT} USDT` : null,
    n.fmvPriceUSD !== null ? `📊 FMV: $${n.fmvPriceUSD}` : null,
    ``,
    `⚠️ Data is approximate and read-only. Always verify before trading.`,
  ].filter(Boolean).join('\n');
}

module.exports = { normalizeListing, normalizePack, formatListingAlertText, formatWeiString, parseGradeNumber };
