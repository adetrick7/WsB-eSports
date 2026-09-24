// Runs every hour via GitHub Actions (.github/workflows/weekly-stats.yml).
// Fetches current lifetime stats for every player in data/roster.json,
// then keeps a short timestamped history so the site can compare a current
// snapshots against the ones closest to 24 hours and 7 days earlier.
//
// The API key is read from an environment variable (set as a GitHub Actions
// secret, FORTNITE_API_KEY) so it is never committed to the repo or exposed
// in the public site — unlike the client-side live-fetch on the Members page,
// this one runs server-side inside GitHub's infrastructure.

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const ROSTER_PATH = path.join(DATA_DIR, "roster.json");
const LATEST_PATH = path.join(DATA_DIR, "latest.json");
const HISTORY_PATH = path.join(DATA_DIR, "history.json");
const HISTORY_RETENTION_MS = 8 * 24 * 60 * 60 * 1000;

const API_KEY = process.env.FORTNITE_API_KEY;
if (!API_KEY) {
  console.error("Missing FORTNITE_API_KEY environment variable.");
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickStats(json) {
  try {
    const overall = json.data.stats.all.overall;
    if (!overall) return null;
    const winRateRaw = parseFloat(overall.winRate);
    return {
      kd: parseFloat(overall.kd) || 0,
      winrate: winRateRaw <= 1 ? winRateRaw * 100 : winRateRaw,
      wins: parseFloat(overall.wins) || 0,
      kills: parseFloat(overall.kills) || 0,
      matches: parseFloat(overall.matches) || 0
    };
  } catch (e) {
    return null;
  }
}

function accountDetails(json) {
  const account = json && json.data && json.data.account ? json.data.account : {};
  return {
    accountId: typeof account.id === "string" && account.id ? account.id : null,
    username: typeof account.name === "string" && account.name ? account.name : null
  };
}

async function fetchPlayerStats(player) {
  const usesAccountId = Boolean(player.accountId);
  const url = usesAccountId
    ? "https://fortnite-api.com/v2/stats/br/v2/" + encodeURIComponent(player.accountId)
    : "https://fortnite-api.com/v2/stats/br/v2?name=" +
      encodeURIComponent(player.username) +
      "&accountType=" +
      encodeURIComponent(player.platform);
  const lookup = usesAccountId ? "account ID" : 'name "' + player.username + '"';

  try {
    const res = await fetch(url, { headers: { Authorization: API_KEY } });
    if (!res.ok) {
      console.warn(`  -> HTTP ${res.status} for ${lookup}`);
      return null;
    }
    const json = await res.json();
    const stats = pickStats(json);
    if (!stats) return null;
    return { stats, ...accountDetails(json) };
  } catch (e) {
    console.warn(`  -> fetch failed for ${lookup}: ${e.message}`);
    return null;
  }
}

async function main() {
  const roster = JSON.parse(fs.readFileSync(ROSTER_PATH, "utf8"));

  const results = {};
  let rosterChanged = false;
  for (const player of roster) {
    const lookup = player.accountId ? "saved account ID" : 'name "' + player.username + '"';
    console.log(`Fetching ${player.displayName} by ${lookup}...`);
    const fetched = await fetchPlayerStats(player);
    if (fetched) {
      if (!player.accountId && fetched.accountId) {
        player.accountId = fetched.accountId;
        rosterChanged = true;
        console.log("  -> saved stable Epic account ID");
      }
      results[player.id] = {
        displayName: player.displayName,
        username: fetched.username || player.username,
        ...fetched.stats
      };
      console.log("  -> OK");
    } else {
      console.log("  -> skipped (fetch failed, will not appear today)");
    }
    // Stay well under the rate limit between requests.
    await sleep(1300);
  }

  if (rosterChanged) {
    fs.writeFileSync(ROSTER_PATH, JSON.stringify(roster, null, 2) + "\n");
    console.log("Saved newly discovered Epic account IDs to data/roster.json.");
  }
  const snapshot = {
    fetchedAt: new Date().toISOString(),
    players: results
  };

  const existingHistory = fs.existsSync(HISTORY_PATH)
    ? JSON.parse(fs.readFileSync(HISTORY_PATH, "utf8"))
    : { snapshots: [] };
  const snapshots = Array.isArray(existingHistory.snapshots) ? existingHistory.snapshots : [];

  // One-time migration: preserve the two legacy snapshots when history starts.
  if (!snapshots.length) {
    for (const legacyPath of [path.join(DATA_DIR, "previous.json"), LATEST_PATH]) {
      if (!fs.existsSync(legacyPath)) continue;
      const legacy = JSON.parse(fs.readFileSync(legacyPath, "utf8"));
      if (legacy && legacy.fetchedAt && legacy.players) snapshots.push(legacy);
    }
  }

  snapshots.push(snapshot);
  const deduped = new Map();
  snapshots.forEach((item) => {
    if (item && item.fetchedAt && item.players) deduped.set(item.fetchedAt, item);
  });
  const cutoff = Date.now() - HISTORY_RETENTION_MS;
  const history = Array.from(deduped.values())
    .filter((item) => Date.parse(item.fetchedAt) >= cutoff)
    .sort((a, b) => Date.parse(a.fetchedAt) - Date.parse(b.fetchedAt));

  fs.writeFileSync(LATEST_PATH, JSON.stringify(snapshot, null, 2));
  fs.writeFileSync(HISTORY_PATH, JSON.stringify({ snapshots: history }, null, 2));
  console.log(`\nWrote ${Object.keys(results).length} player snapshots to data/latest.json and retained ${history.length} history snapshots.`);
}

main();
