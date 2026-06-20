import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const reportsDir = path.resolve(rootDir, 'lighthouse-reports');
const summaryPath = path.resolve(rootDir, 'lighthouse-summary.md');

const url = process.env.LH_URL || process.argv[2] || 'http://localhost:5173';

const serveMode = process.argv.includes('--serve');
if (serveMode) {
  const reports = fs.readdirSync(reportsDir).filter(f => f.endsWith('.html')).sort().reverse();
  if (reports.length === 0) {
    console.error('No reports found in lighthouse-reports/');
    process.exit(1);
  }
  const latest = path.resolve(reportsDir, reports[0]);
  console.log(`Opening latest report: ${latest}`);
  console.log(`file://${latest.replace(/\\/g, '/')}`);
  process.exit(0);
}

let chrome;
try {
  chrome = await launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  const opts = {
    logLevel: process.env.CI ? 'error' : 'info',
    output: 'html',
    port: chrome.port,
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  };

  const result = await lighthouse(url, opts, null);

  if (!result || !result.lhr) {
    console.error('Lighthouse audit failed — no result');
    process.exit(1);
  }

  fs.mkdirSync(reportsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `report-${timestamp}.html`;
  fs.writeFileSync(path.join(reportsDir, fileName), result.report);

  const { categories } = result.lhr;
  const scores = {};
  for (const [key, cat] of Object.entries(categories)) {
    scores[key] = Math.round(cat.score * 100);
  }

  const summaryLines = [
    '# Lighthouse Audit Summary',
    '',
    `**URL:** ${url}`,
    `**Date:** ${new Date().toISOString()}`,
    `**Report:** \`${fileName}\``,
    '',
    '| Category | Score |',
    '|----------|------:|',
  ];
  for (const [cat, score] of Object.entries(scores)) {
    summaryLines.push(`| ${cat} | ${score} |`);
  }
  summaryLines.push('');

  const summary = summaryLines.join('\n');
  fs.writeFileSync(summaryPath, summary);
  console.log(summary);
  console.log(`\nHTML report saved: ${path.join(reportsDir, fileName)}`);
} finally {
  if (chrome) await chrome.kill();
}
