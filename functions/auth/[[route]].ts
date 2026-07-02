import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import type { Bindings } from '../_lib/types';
import { buildAuthorizeUrl, exchangeCodeForToken, fetchKakaoUser } from '../_lib/kakao';
import { findOrCreateMember } from '../_lib/db';
import { setSessionCookie } from '../_lib/session';

const app = new Hono<{ Bindings: Bindings }>().basePath('/auth');

app.get('/kakao/login', (c) => {
  const redirectUri = new URL('/auth/kakao/callback', c.req.url).toString();
  return c.redirect(buildAuthorizeUrl(c.env.KAKAO_REST_API_KEY, redirectUri));
});

app.get('/kakao/callback', async (c) => {
  const code = c.req.query('code');
  if (!code) return c.text('missing code', 400);

  const redirectUri = new URL('/auth/kakao/callback', c.req.url).toString();
  try {
    const accessToken = await exchangeCodeForToken({
      code,
      redirectUri,
      restApiKey: c.env.KAKAO_REST_API_KEY,
      clientSecret: c.env.KAKAO_CLIENT_SECRET,
    });
    const kakaoUser = await fetchKakaoUser(accessToken);
    const member = await findOrCreateMember(c.env.DB, kakaoUser.id, kakaoUser.nickname, kakaoUser.profileImageUrl);
    await setSessionCookie(c, member.id);
    return c.redirect('/');
  } catch (e) {
    return c.text('카카오 로그인에 실패했습니다.', 500);
  }
});

export const onRequest = handle(app);
