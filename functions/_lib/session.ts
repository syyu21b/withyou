import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';
import type { Context } from 'hono';
import type { Bindings } from './types';

const COOKIE_NAME = 'session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30일

export async function setSessionCookie<E extends { Bindings: Bindings }>(
  c: Context<E>,
  memberId: number
): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const token = await sign({ memberId, exp }, c.env.SESSION_SECRET);
  const isHttps = new URL(c.req.url).protocol === 'https:';
  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    secure: isHttps, // 로컬(wrangler pages dev, http)에서는 Secure를 끄고 운영(https)에서만 켠다
    sameSite: 'Lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie<E extends { Bindings: Bindings }>(c: Context<E>): void {
  deleteCookie(c, COOKIE_NAME, { path: '/' });
}

export async function verifySessionCookie<E extends { Bindings: Bindings }>(c: Context<E>): Promise<number | null> {
  const token = getCookie(c, COOKIE_NAME);
  if (!token) return null;
  try {
    const payload = await verify(token, c.env.SESSION_SECRET, 'HS256');
    const memberId = payload.memberId;
    return typeof memberId === 'number' ? memberId : null;
  } catch {
    return null;
  }
}
