import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import type { Bindings } from '../_lib/types';

const app = new Hono<{ Bindings: Bindings }>();

// /i/{slug} 요청은 정적 index.html을 그대로 서빙한다.
// 실제 초대장 데이터 로딩/렌더링은 프론트 JS가 경로를 감지해 /api/invitations/public/{slug}를 호출해 처리한다.
app.get('/i/:slug', (c) => {
  const assetUrl = new URL('/index.html', c.req.url);
  return c.env.ASSETS.fetch(assetUrl.toString());
});

export const onRequest = handle(app);
