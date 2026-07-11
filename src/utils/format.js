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
  };
}

function normalizePack(raw) {
  const priceUsdt = formatWeiString(raw.priceInUsdt);
  const evUsd = raw.expectedValueInUsd ? Number(raw.expectedValueInUsd) / 100 : null;
  const featuredCardFmvUsd = raw.featuredCardFmvInUsd ? Number(raw.featuredCardFmvInUsd) / 100 : null;
  return {
    slug: raw.slug,
    name: raw.name,
    stage: raw.stage,
    priceUsdt,
    evUsd,
    featuredCardFmvUsd,
    evRatio: priceUsdt && evUsd ? Number((evUsd / priceUsdt).toFixed(2)) : null,
  };
}


// expects an already-normalized listing (see poller.js)
function formatListingAlertText(n) {
  return [
`🔖 *NEW LISTING MATCH*`,
    ``,
    `📇 *${n.name || 'Unknown card'}*`,
    ``,
    n.set ? `📦 *Set:* ${n.set}` : null,
    n.character ? `🎴 *Character:* ${n.character}` : null,
    n.grade ? `🏅 *Grade:* ${n.grade}${n.gradingCompany ? ` (${n.gradingCompany})` : ''}` : null,
    n.askPriceUSDT !== null ? `💰 *Ask:* ${n.askPriceUSDT} USDT` : null,
    n.fmvPriceUSD !== null ? `📊 *FMV:* $${n.fmvPriceUSD}` : null,
  ]
    .filter((line) => line !== null)
    .join('\n');
}

module.exports = { normalizeListing, normalizePack, formatListingAlertText, formatWeiString, parseGradeNumber };
