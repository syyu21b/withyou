import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const sourceDir = resolve(rootDir, 'src/main/resources/static');
const outputDir = resolve(rootDir, 'dist');

if (!existsSync(sourceDir)) {
  throw new Error(`정적 리소스 폴더를 찾을 수 없습니다: ${sourceDir}`);
}

// Cloudflare Pages가 배포할 정적 결과물을 매번 새로 생성합니다.
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });
cpSync(sourceDir, outputDir, { recursive: true });

console.log(`정적 파일을 dist 폴더로 복사했습니다: ${sourceDir} -> ${outputDir}`);
