import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const sourceDir = resolve(rootDir, 'src/main/resources/static');
const outputDir = resolve(rootDir, 'dist');
const fallbackSiteUrl = 'https://young-union-8a76.syyu21b.workers.dev';

if (!existsSync(sourceDir)) {
  throw new Error(`정적 리소스 폴더를 찾을 수 없습니다: ${sourceDir}`);
}

// Cloudflare Pages가 배포할 정적 결과물을 매번 새로 생성합니다.
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });
cpSync(sourceDir, outputDir, { recursive: true });

const siteUrl = normalizeSiteUrl(process.env.SITE_URL || process.env.CF_PAGES_URL || fallbackSiteUrl);
const indexPath = resolve(outputDir, 'index.html');

if (existsSync(indexPath)) {
  // Cloudflare Pages의 실제 배포 URL에 맞춰 공유 메타 주소를 보정합니다.
  const html = readFileSync(indexPath, 'utf8')
    .replaceAll(`${fallbackSiteUrl}/`, `${siteUrl}/`)
    .replaceAll(`${fallbackSiteUrl}/og-image.png`, `${siteUrl}/og-image.png`);

  writeFileSync(indexPath, html, 'utf8');
}

console.log(`정적 파일을 dist 폴더로 복사했습니다: ${sourceDir} -> ${outputDir}`);
console.log(`Open Graph 기준 URL을 설정했습니다: ${siteUrl}/`);

function normalizeSiteUrl(value) {
  return String(value || fallbackSiteUrl).replace(/\/+$/, '');
}
