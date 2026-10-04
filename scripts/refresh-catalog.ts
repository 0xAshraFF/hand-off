
import fs from 'fs';
import path from 'path';

const catalogPath = path.join(process.cwd(), 'data', 'catalog.snapshot.json');
const snapshot = JSON.parse(fs.readFileSync(catalogPath, 'utf8')) as any;
const now = new Date().toISOString();

type CheckResult = {
  source: string;
  ok: boolean;
  checkedAt: string;
  note: string;
};

const checks: CheckResult[] = [];

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'HandoffCatalogBot/0.2 (+https://github.com/0xAshraFF/hand-off)'
    }
  });
  if (!response.ok) throw new Error(String(response.status) + ' ' + response.statusText);
  return response.text();
}

function item(id: string) {
  return snapshot.items.find((entry: any) => entry.id === id);
}

async function checkGoogleImagePricing() {
  const url = 'https://ai.google.dev/gemini-api/docs/pricing';
  try {
    const html = await fetchText(url);
    const target = item('gemini-3-1-flash-image');
    const match = html.match(/\$0\.067\s*(?:per|\/)?\s*1K image/i);
    if (target && match) {
      target.pricing.unitCost = 0.067;
      target.pricing.unit = '1K image';
      target.lastVerified = now;
      checks.push({ source: url, ok: true, checkedAt: now, note: 'Gemini 3.1 Flash Image 1K output price verified.' });
      return;
    }
    checks.push({ source: url, ok: false, checkedAt: now, note: 'Pricing page loaded but the known 1K image pattern was not found; previous value preserved.' });
  } catch (error: any) {
    checks.push({ source: url, ok: false, checkedAt: now, note: 'Fetch failed: ' + (error?.message || 'unknown error') });
  }
}

async function checkAlibabaImagePricing() {
  const url = 'https://www.alibabacloud.com/help/en/model-studio/model-pricing';
  try {
    const html = await fetchText(url);
    const target = item('qwen-image-2-0');
    const match = html.match(/qwen-image-2\.0[\s\S]{0,900}?\$0\.035\s*\/\s*image/i);
    if (target && match) {
      target.pricing.unitCost = 0.035;
      target.pricing.unit = 'image';
      target.lastVerified = now;
      checks.push({ source: url, ok: true, checkedAt: now, note: 'Qwen Image 2.0 international per-image price verified.' });
      return;
    }
    checks.push({ source: url, ok: false, checkedAt: now, note: 'Pricing page loaded but the expected Qwen Image 2.0 pattern was not found; previous value preserved.' });
  } catch (error: any) {
    checks.push({ source: url, ok: false, checkedAt: now, note: 'Fetch failed: ' + (error?.message || 'unknown error') });
  }
}

async function checkDeepSeekPricing() {
  const url = 'https://api-docs.deepseek.com/quick_start/pricing/';
  try {
    const html = await fetchText(url);
    const flash = item('deepseek-flash');
    const pro = item('deepseek-v4-pro');

    const hasFlash = /deepseek-flash/i.test(html);
    const hasPro = /deepseek-v4-pro/i.test(html);
    const hasPeakFlash = /0\.3[\s\S]{0,900}?1\.2/i.test(html);
    const hasPeakPro = /1\.32[\s\S]{0,900}?3\.96/i.test(html);

    if (flash && hasFlash && hasPeakFlash) {
      flash.pricing.inputPer1M = 0.30;
      flash.pricing.outputPer1M = 1.20;
      flash.lastVerified = now;
    }
    if (pro && hasPro && hasPeakPro) {
      pro.pricing.inputPer1M = 1.32;
      pro.pricing.outputPer1M = 3.96;
      pro.lastVerified = now;
    }

    checks.push({
      source: url,
      ok: Boolean(hasFlash && hasPro),
      checkedAt: now,
      note: hasFlash && hasPro
        ? 'DeepSeek model availability verified; recognized price patterns update stored peak rates.'
        : 'DeepSeek pricing page loaded but model markers changed; previous values preserved.'
    });
  } catch (error: any) {
    checks.push({ source: url, ok: false, checkedAt: now, note: 'Fetch failed: ' + (error?.message || 'unknown error') });
  }
}

async function checkSourceReachability(id: string) {
  const target = item(id);
  if (!target?.sourceUrl) return;
  try {
    const response = await fetch(target.sourceUrl, {
      method: 'GET',
      headers: { 'user-agent': 'HandoffCatalogBot/0.2 (+https://github.com/0xAshraFF/hand-off)' }
    });
    if (response.ok) target.lastVerified = now;
    checks.push({
      source: target.sourceUrl,
      ok: response.ok,
      checkedAt: now,
      note: response.ok ? target.name + ' source reachable.' : target.name + ' source returned ' + response.status + '.'
    });
  } catch (error: any) {
    checks.push({ source: target.sourceUrl, ok: false, checkedAt: now, note: target.name + ' source fetch failed: ' + (error?.message || 'unknown error') });
  }
}

await Promise.all([
  checkGoogleImagePricing(),
  checkAlibabaImagePricing(),
  checkDeepSeekPricing(),
  checkSourceReachability('glm-5-3'),
  checkSourceReachability('claude-sonnet'),
  checkSourceReachability('chatgpt-plus'),
  checkSourceReachability('cloudflare-pages')
]);

snapshot.generatedAt = now;
snapshot.sourceChecks = checks;
snapshot.policy = {
  ...(snapshot.policy || {}),
  lastRefreshResult: {
    checkedAt: now,
    successfulSources: checks.filter((check) => check.ok).length,
    failedSources: checks.filter((check) => !check.ok).length
  }
};

fs.writeFileSync(catalogPath, JSON.stringify(snapshot, null, 2) + '\n');
console.log('Catalog refreshed:', snapshot.policy.lastRefreshResult);
