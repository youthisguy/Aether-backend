const { execFile } = require('child_process');
const config = require('../config');

function runCli(args) {
  return new Promise((resolve, reject) => {
    execFile('npx', ['renaiss', ...args], { timeout: config.CLI_TIMEOUT_MS }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(`CLI error running "renaiss ${args.join(' ')}": ${stderr || err.message}`));
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (parseErr) {
        reject(new Error(`Failed to parse CLI JSON for "renaiss ${args.join(' ')}": ${parseErr.message}`));
      }
    });
  });
}

async function getMarketplaceListingsRaw(opts = {}) {
    const args = ['marketplace', '--json'];
    if (opts.category) args.push('--category', opts.category);
    if (opts.grading) args.push('--grading', opts.grading);
    if (opts.grade) args.push('--grade', opts.grade);
    if (opts.price) args.push('--price', opts.price);
    if (opts.year) args.push('--year', opts.year);
    if (opts.language) args.push('--language', opts.language);
    if (opts.character) args.push('--character', opts.character);
    if (opts.search) args.push('--search', opts.search);
    args.push('--sort', opts.sort || 'listDate');
    args.push('--order', opts.order || 'desc');
    args.push('--limit', String(opts.limit || 50));
    args.push('--offset', String(opts.offset || 0));
    return runCli(args);
  }

  async function getMarketplaceListings(opts = {}) {
    const result = await getMarketplaceListingsRaw(opts);
    return result.collection || [];
  }

async function getCardDetail(tokenId) {
  return runCli(['card', tokenId, '--price', '--activities', '--json']);
}

module.exports = {
    getMarketplaceListings,
    getMarketplaceListingsRaw,
    getCardDetail,
  };