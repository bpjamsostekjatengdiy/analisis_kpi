const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(require.resolve('playwright', { paths: [process.argv[2]] }));

(async () => {
  const output = process.argv[3];
  await fs.mkdir(output, { recursive: true });
  const source = await fs.readFile(path.join(__dirname, '..', 'app.js'), 'utf8');
  const url = source.match(/sourceUrl:\s*\n?\s*"([^"]+)"/)[1];
  const csvResponse = await fetch(url, { signal: AbortSignal.timeout(45000) });
  assert.ok(csvResponse.ok, 'Live KPI source responds');
  const csv = await csvResponse.text();
  const libraryResponse = await fetch('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
  assert.ok(libraryResponse.ok, 'Export library responds');
  const library = await libraryResponse.text();
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 }, acceptDownloads: true });
    await page.route('**/pub?*', route => route.fulfill({ contentType: 'text/csv', body: csv }));
    await page.route('**/html2canvas.min.js', route => route.fulfill({ contentType: 'application/javascript', body: library }));
    for (const width of [1366, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('http://127.0.0.1:8091/index.html');
      await page.locator('#dashboardContent').waitFor({ state: 'visible', timeout: 45000 });
      const before = await page.locator('.dashboard').boundingBox();
      const narrative = await page.locator('.executive-grid > .narrative-panel').boundingBox();
      const insight = await page.locator('.executive-grid > .rank-insight').boundingBox();
      assert.ok(width > 900 ? narrative.x + narrative.width <= insight.x && narrative.y === insight.y
        : narrative.y + narrative.height <= insight.y, 'Executive panels align on desktop and stack on mobile');
      const parameters = await page.locator('.monitoring-column > .main-parameter-panel').boundingBox();
      const verdict = await page.locator('.monitoring-column > #verdict').boundingBox();
      assert.ok(parameters.y + parameters.height <= verdict.y, 'Conclusion appears below monitoring');
      assert.equal(await page.locator('.rank-insight .insight-actions #actions .action').count(), 3);
      const comparisons = await page.locator('.parameter-comparison-grid > .comparison-panel').boundingBox();
      assert.ok(width > 1040 ? parameters.x + parameters.width <= comparisons.x && parameters.y === comparisons.y
        : parameters.y + parameters.height <= comparisons.y, 'Monitoring and comparison panels align without overlapping');
      const comparisonOrder = await page.locator('.comparison-panel tbody').evaluateAll(bodies => bodies.map(body => body.id));
      assert.deepEqual(comparisonOrder, ['aboveTable', 'belowRiskTable', 'bufferTable']);
      const down = await page.locator('.negative-growth-block').boundingBox();
      const up = await page.locator('.primary-parameter-subpanel').boundingBox();
      assert.ok(down.y + down.height <= up.y, 'Parameter Turun appears above Parameter Naik / Stabil');
      assert.equal(down.width, up.width, 'Both monitoring panels use the same width');
      await page.evaluate(() => {
        const original = window.html2canvas;
        window.html2canvas = (element, options) => original(element, {
          ...options,
          onclone: async doc => {
            await options.onclone(doc);
            const style = selector => doc.defaultView.getComputedStyle(doc.querySelector(selector));
            const clipped = [];
            const smallCells = [];
            doc.querySelectorAll('td').forEach(td => {
              if (td.scrollWidth > td.clientWidth + 2) clipped.push(td.textContent.trim());
              if (parseFloat(doc.defaultView.getComputedStyle(td).fontSize) < 14) smallCells.push(td.textContent.trim());
            });
            window.exportMetrics = {
              width: doc.querySelector('.dashboard').getBoundingClientRect().width,
              height: doc.querySelector('.dashboard').getBoundingClientRect().height,
              narrativeFont: style('.narrative-item p').fontSize,
              tableFont: style('.main-parameter-table tbody tr:not(.movement-section-row) td').fontSize,
              numberFont: style('.main-parameter-table tbody tr:not(.movement-section-row) td:nth-child(2)').fontSize,
              insightFont: style('#rankInsightSummary').fontSize,
              noteFont: style('.rank-note').fontSize,
              scoreFont: style('.rank-score').fontSize,
              painPointFont: style('.critical-table td:nth-child(2)').fontSize,
              scoreboardRows: Array.from(doc.querySelectorAll('.scoreboard > article'), card => card.getBoundingClientRect().top),
              narrativeColumns: Array.from(doc.querySelectorAll('.narrative-item'), row => row.cells.length),
              executiveColumns: style('.executive-grid').gridTemplateColumns,
              comparisonColumns: style('.parameter-comparison-grid').gridTemplateColumns,
              tableColumns: style('.main-parameter-panel').gridTemplateColumns,
              clipped, smallCells,
            };
          },
        });
      });
      const downloadPromise = page.waitForEvent('download', { timeout: 90000 });
      await page.locator('#exportJpgBtn').click();
      const download = await downloadPromise;
      assert.match(download.suggestedFilename(), /\.jpeg$/);
      const file = path.join(output, `kpi-${width}.jpeg`);
      await download.saveAs(file);
      await page.waitForFunction(() => !document.getElementById('exportJpgBtn').disabled);
      const after = await page.locator('.dashboard').boundingBox();
      const metrics = await page.evaluate(() => ({ ...window.exportMetrics,
        changedScreen: document.body.classList.contains('is-exporting') }));
      assert.equal(metrics.width, 1400);
      assert.equal(metrics.narrativeFont, '20px');
      assert.deepEqual(metrics.narrativeColumns, [1, 1, 1, 1, 1], 'Each narrative topic has a full-width row');
      assert.equal(metrics.executiveColumns.split(' ').length, 2, 'Narrative and Insight are side by side in JPG');
      assert.equal(metrics.comparisonColumns.split(' ').length, 2, 'Monitoring and comparison are side by side in JPG');
      assert.equal(metrics.tableFont, '20px');
      assert.equal(metrics.numberFont, '18px');
      assert.equal(metrics.insightFont, '20px');
      assert.equal(metrics.noteFont, '18px');
      assert.equal(metrics.scoreFont, '36px');
      assert.equal(metrics.painPointFont, '14px');
      assert.equal(metrics.scoreboardRows.length, 4);
      assert.equal(new Set(metrics.scoreboardRows).size, 1, 'Pain Point and rank cards share a row in JPG');
      assert.ok(metrics.height < 4100, 'Export remains shorter than the original stacked layout');
      assert.equal(metrics.tableColumns.split(' ').length, 1, 'Monitoring tables use the full width');
      assert.equal(metrics.clipped.length, 0, 'Export table cells fit: ' + metrics.clipped.join(', '));
      assert.equal(metrics.smallCells.length, 0, 'All export table text is at least 14px: ' + metrics.smallCells.join(', '));
      assert.equal(metrics.changedScreen, false);
      assert.equal(before.width, after.width, 'Screen layout restored');
      const info = await fs.stat(file);
      assert.ok(info.size > 100000, 'Export contains a nonempty JPEG');
      console.log(JSON.stringify({ viewport: width, file, bytes: info.size, ...metrics }));
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
