// Exercise the actual worker with virtual files and mocked HTTP. No credentials,
// live API calls, production writes, or changes to real snapshot files.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const filename = path.resolve(__dirname, '../../scripts/fetch-weekly-stats.js');
const realRequire = require('node:module').createRequire(filename);
const source = fs.readFileSync(filename, 'utf8').replace(/\bmain\(\);?\s*$/, '');
const root = path.dirname(path.dirname(filename));
const exactName = 'i\uFC5E hate\uFC5E zb';
const timestamp = new Date(Date.now() - 3600000).toISOString();
const numbers = { kd: 2, wins: 10, kills: 100, matches: 50 };
function queued(id, name, extra = {}) {
  return { name: 'projects/demo-worker/databases/(default)/documents/memberAccess/' + id,
    updateTime: timestamp, fields: { displayName: { stringValue: name }, fortniteUsername: { stringValue: name }, rosterStatus: { stringValue: 'pending' }, invitedEmail: { stringValue: 'private@test.invalid' }, ...extra } };
}
async function run({ roster, documents, previous = { fetchedAt: timestamp, players: {} }, responses = {}, failAck = false }) {
  const files = new Map([
    [path.join(root, 'data/roster.json'), JSON.stringify(roster)],
    [path.join(root, 'data/latest.json'), JSON.stringify(previous)],
    [path.join(root, 'data/history.json'), JSON.stringify({ snapshots: [] })],
    [path.join(root, 'templates/player.html'), '<title>Player Stats</title><body data-member-id="{{memberId}}"></body>']
  ]);
  for (const member of roster) files.set(path.join(root, 'stats', member.id, 'index.html'), 'existing-page-' + member.id);
  const calls = [], acknowledgements = [], writes = [];
  const virtualFs = { readFileSync(file) { assert(files.has(file), 'Unknown virtual read: ' + file); return files.get(file); },
    existsSync: file => files.has(file), mkdirSync() {}, writeFileSync(file, data) { writes.push(file); files.set(file, data); } };
  const context = vm.createContext({
    require: name => name === 'fs' ? virtualFs : realRequire(name), __dirname: path.dirname(filename), Buffer, URLSearchParams, AbortSignal,
    process: { env: { FORTNITE_API_KEY: 'isolated-test-only', FIREBASE_SERVICE_ACCOUNT: '{"project_id":"demo-worker"}' }, exit() { throw Error('Unexpected worker exit'); } },
    console: { log() {}, warn() {}, error() {} },
    fetch: async (raw, options = {}) => {
      const url = new URL(String(raw));
      if (url.hostname === 'firestore.googleapis.com' && options.method === 'PATCH') {
        acknowledgements.push({ id: url.pathname.split('/').pop(), revision: url.searchParams.get('currentDocument.updateTime'), body: JSON.parse(options.body) });
        return { ok: !failAck, status: failAck ? 412 : 200 };
      }
      if (url.hostname === 'firestore.googleapis.com' && url.pathname.endsWith('/memberAccess')) return { ok: true, json: async () => ({ documents }) };
      assert.equal(url.hostname, 'fortnite-api.com', 'No unmocked network access');
      const lookup = url.searchParams.has('name') ? url.searchParams.get('name') : url.pathname.split('/').pop();
      calls.push({ lookup, url });
      const response = responses[lookup];
      if (!response || typeof response === 'number') return { ok: false, status: response || 404 };
      return { ok: true, json: async () => ({ data: { account: { id: response.id, name: response.name || lookup }, stats: { all: { overall: numbers } } } }) };
    }
  });
  vm.runInContext(source + '\nfirebaseAccessToken=async()=>"isolated-token";sleep=async()=>{};globalThis.runWorker=main;', context);
  await context.runWorker();
  return { roster: JSON.parse(files.get(path.join(root, 'data/roster.json'))), latest: JSON.parse(files.get(path.join(root, 'data/latest.json'))), files, calls, acknowledgements, writes };
}
(async () => {
  const roster = [
    { id: 'i-hate-zb', displayName: 'i hate zb', username: 'i hate zb', platform: 'epic', profileImage: 'saved-photo.png' },
    { id: 'stable', displayName: 'Old name', username: 'OldEpicName', platform: 'epic', accountId: 'saved-epic-id', profileImage: 'stable.png' },
    { id: 'failed', displayName: 'Old failed', username: 'OldFailed', platform: 'epic', accountId: 'failed-epic-id', profileImage: null }
  ];
  const documents = [queued('i-hate-zb', exactName), queued('stable', 'RenamedEpicName'), queued('new-member', 'NewEpicName'), queued('failed', 'CorrectedFailedName'), queued('ingraham', 'NeverFetch'), queued('unsafe id', 'Unsafe')];
  const previous = { fetchedAt: timestamp, players: { failed: { ...numbers, winrate: 20, username: 'OldFailed', accountId: 'failed-epic-id' } } };
  const result = await run({ roster, documents, previous, responses: { [exactName]: { id: 'newly-resolved-id' }, 'saved-epic-id': { id: 'saved-epic-id', name: 'RenamedEpicName' }, NewEpicName: { id: 'brand-new-id' }, 'failed-epic-id': 403 } });
  const corrected = result.roster.find(member => member.id === 'i-hate-zb');
  assert.equal(corrected.username, exactName); assert.equal(corrected.displayName, exactName); assert.equal(corrected.accountId, 'newly-resolved-id'); assert.equal(corrected.profileImage, 'saved-photo.png');
  assert.equal(result.calls[0].lookup, exactName); assert(result.calls[0].url.href.includes('%EF%B1%9E'), 'Unicode survives URL encoding');
  assert.equal(result.latest.players['i-hate-zb'].username, exactName); assert.equal(result.latest.sync['i-hate-zb'].state, 'synced');
  assert.equal(result.roster.find(member => member.id === 'stable').accountId, 'saved-epic-id');
  assert.equal(result.roster.find(member => member.id === 'stable').profileImage, 'stable.png');
  assert(result.calls.some(call => call.lookup === 'saved-epic-id')); assert(!result.calls.some(call => call.lookup === 'RenamedEpicName'));
  assert.equal(new Set(result.roster.map(member => member.id)).size, result.roster.length); assert.equal(result.roster.length, 4);
  assert.equal(result.files.get(path.join(root, 'stats/i-hate-zb/index.html')), 'existing-page-i-hate-zb');
  assert(result.files.get(path.join(root, 'stats/new-member/index.html')).includes('data-member-id="new-member"'));
  assert.equal(result.latest.players.failed.kills, numbers.kills); assert.equal(result.latest.sync.failed.state, 'stale');
  assert.equal(result.roster.find(member => member.id === 'failed').username, 'CorrectedFailedName');
  assert.deepEqual(result.acknowledgements.map(entry => entry.id), ['i-hate-zb', 'stable', 'new-member']);
  for (const entry of result.acknowledgements) { assert.equal(entry.revision, timestamp); assert.deepEqual(Object.keys(entry.body.fields).sort(), ['rosterStatus', 'rosterSyncedAt']); }
  assert(!JSON.stringify(result.roster).includes('private@test.invalid')); assert(!result.roster.some(member => member.id === 'ingraham'));
  const again = await run({ roster: result.roster, documents: [], previous: result.latest, responses: { 'newly-resolved-id': { id: 'newly-resolved-id', name: exactName } } });
  assert.equal(again.calls[0].lookup, 'newly-resolved-id', 'Later refreshes use the stable Epic ID'); assert.equal(again.roster.length, 4);
  const conflict = await run({ roster: roster.slice(0, 1), documents: [queued('i-hate-zb', exactName)], responses: { [exactName]: { id: 'newly-resolved-id' } }, failAck: true });
  assert.equal(conflict.latest.sync['i-hate-zb'].state, 'synced'); assert.equal(conflict.acknowledgements[0].revision, timestamp, 'Newer admin edits are protected by the Firestore revision precondition');
  const unchanged = await run({ roster: [result.roster[0]], documents: [queued('i-hate-zb', exactName)], responses: { 'newly-resolved-id': { id: 'newly-resolved-id', name: exactName } } });
  assert(!unchanged.writes.includes(path.join(root, 'data/roster.json')), 'Identical queued data does not rewrite the roster');
  console.log('PASS: real worker applies queued existing-member corrections, preserves exact Unicode/IDs/photos, resolves and reuses Epic IDs, adds one new page, retains failed stats, retries failed queues, guards concurrent edits and excludes private data/display-only members.');
})().catch(error => { console.error(error); process.exitCode = 1; });
