const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8').split('\nloadDashboard();')[0];
const elements = new Map();
const context = vm.createContext({
  document: { getElementById(id) {
    if (!elements.has(id)) elements.set(id, {});
    return elements.get(id);
  } },
});
vm.runInContext(source, context);

function scenario(ownRank = 1, ownOldRank = 2) {
  const metrics = [
    ['JP', '-0,01', '-0,07'],
    ['Jakon', '0,07', '0,03'],
    ['Iuran', '0,07', '0,04'],
    ['BPU', '-0,05', '-0,07'],
    ['Governance', '0', '0,02'],
    ['Unknown', '', '0'],
  ];
  return ['905', '908'].flatMap((code, index) => metrics.map(([name, own, other]) => ({
    kode_kantor: code, nama_kantor: `UNIT ${code}`, kode_detil: name, nama: name,
    rank: String(index ? 1 : ownRank), 'rank_h-1': String(index ? 1 : ownOldRank),
    score_total: index ? '66,17' : '66,23',
    'score_total_h-1': index ? '66,22' : '66,13',
    score_growth2: index ? '0,02' : '0,11',
    score_growth: index ? other : own, score: 'NULL', 'score_h-1': 'NULL',
  })));
}

function analyze(rows, selectedCode = 'KW:905') {
  context.rows = rows;
  context.code = selectedCode;
  return vm.runInContext(`(() => {
    const peers = uniqueKanwils(rows);
    const index = peers.findIndex(unit => unit.code === code);
    return rankInsightData(rows, peers[index], peers, peers[index - 1], peers[index + 1]);
  })()`, context);
}

test('rank gain uses crossed peer and top 3 relative score drivers, including smaller declines', () => {
  const result = analyze(scenario());
  assert.equal(result.comparator.rawCode, '908');
  assert.equal(result.rankChange, 1);
  assert.deepEqual(Array.from(result.top, item => item.name), ['JP', 'Jakon', 'Iuran']);
  assert.ok(Math.abs(result.top[0].difference - 0.06) < 1e-8);
  assert.ok(Math.abs(result.currentGap - result.previousGap - 0.15) < 1e-8);
  assert.ok(result.notes.some(note => note.includes('Peringkat') || note.includes('rank 1')));
  assert.ok(result.notes.some(note => note.includes('Growth total 908')));
  assert.ok(result.notes.some(note => note.includes('data kosong tidak dianggap 0')));
  context.result = result;
  vm.runInContext('renderRankInsight(result)', context);
  assert.match(elements.get('rankInsightSummary').textContent, /naik dari 2 menjadi 1/);
  assert.match(elements.get('rankInsightTable').innerHTML, /kita turun lebih kecil/);
});

test('rank loss selects negative relative drivers rather than largest raw growth', () => {
  const rows = scenario(2, 1).map(row => ({ ...row,
    'rank_h-1': row.kode_kantor === '908' ? '2' : '1',
    score_total: row.kode_kantor === '908' ? '67' : '66',
    'score_total_h-1': row.kode_kantor === '908' ? '65' : '66',
  }));
  const result = analyze(rows);
  assert.equal(result.rankChange, -1);
  assert.equal(result.comparator.rawCode, '908');
  assert.equal(result.top[0].name, 'Governance');
  assert.ok(result.top.every(item => item.difference < 0));
});

test('unchanged rank reports relative pressure, not a rank change', () => {
  const result = analyze(scenario(1, 1));
  context.result = result;
  vm.runInContext('renderRankInsight(result)', context);
  assert.match(elements.get('rankInsightSummary').textContent, /Rank tetap 1/);
});

test('missing growth falls back to score snapshots but missing snapshots never become zero', () => {
  assert.equal(vm.runInContext("parameterScoreGrowth({score_growth: '', score: '2,4', 'score_h-1': '2,3'})", context).toFixed(2), '0.10');
  assert.equal(vm.runInContext("parameterScoreGrowth({score_growth: '', score: 'NULL', 'score_h-1': 'NULL'})", context), null);
});

test('missing previous rank and single unit have honest empty states', () => {
  const rows = scenario().filter(row => row.kode_kantor === '905')
    .map(row => ({ ...row, 'rank_h-1': '' }));
  const result = analyze(rows);
  assert.equal(result.rankChange, null);
  assert.equal(result.comparator, null);
  context.result = result;
  vm.runInContext('renderRankInsight(result)', context);
  assert.match(elements.get('rankInsightSummary').textContent, /Belum ada kantor pembanding/);
  assert.match(elements.get('insightRankChange').textContent, /H-1 belum tersedia/);
});
