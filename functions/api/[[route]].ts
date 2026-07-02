import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import type { Bindings } from '../_lib/types';
import { verifySessionCookie, clearSessionCookie } from '../_lib/session';
import {
  getMemberById,
  createInvitation,
  updateInvitation,
  getInvitationOwner,
  getInvitationById,
  getInvitationBySlug,
  listInvitationsByMember,
  deleteInvitationById,
  type InvitationInput,
} from '../_lib/db';

type Variables = { memberId: number };
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().basePath('/api');

async function requireAuth(c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) {
  const memberId = await verifySessionCookie(c);
  if (!memberId) return c.body(null, 401);
  c.set('memberId', memberId);
  await next();
}

function toInvitationInput(body: any): InvitationInput {
  return {
    theme: body.theme ?? '',
    groomName: body.groomName ?? '',
    brideName: body.brideName ?? '',
    weddingDate: body.weddingDate ?? '',
    contentJson: JSON.stringify(body.content ?? {}),
  };
}

app.get('/auth/me', async (c) => {
  const memberId = await verifySessionCookie(c);
  if (!memberId) return c.body(null, 401);
  const member = await getMemberById(c.env.DB, memberId);
  if (!member) return c.body(null, 401);
  return c.json({ id: member.id, nickname: member.nickname, profileImageUrl: member.profileImageUrl });
});

app.post('/auth/logout', (c) => {
  clearSessionCookie(c);
  return c.body(null, 204);
});

app.post('/invitations', requireAuth, async (c) => {
  const body = await c.req.json();
  const saved = await createInvitation(c.env.DB, c.get('memberId'), toInvitationInput(body));
  return c.json(saved);
});

app.put('/invitations/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'));
  const owner = await getInvitationOwner(c.env.DB, id);
  if (!owner) return c.body(null, 404);
  if (owner.memberId !== c.get('memberId')) return c.body(null, 403);

  const body = await c.req.json();
  await updateInvitation(c.env.DB, id, toInvitationInput(body));
  return c.json({ id, slug: owner.slug });
});

app.get('/invitations/mine', requireAuth, async (c) => {
  const items = await listInvitationsByMember(c.env.DB, c.get('memberId'));
  return c.json(items);
});

app.get('/invitations/public/:slug', async (c) => {
  const invitation = await getInvitationBySlug(c.env.DB, c.req.param('slug'));
  if (!invitation) return c.body(null, 404);
  return c.json({ theme: invitation.theme, content: JSON.parse(invitation.contentJson) });
});

app.get('/invitations/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'));
  const owner = await getInvitationOwner(c.env.DB, id);
  if (!owner) return c.body(null, 404);
  if (owner.memberId !== c.get('memberId')) return c.body(null, 403);

  const invitation = await getInvitationById(c.env.DB, id);
  if (!invitation) return c.body(null, 404);
  return c.json({ theme: invitation.theme, content: JSON.parse(invitation.contentJson) });
});

app.delete('/invitations/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'));
  const owner = await getInvitationOwner(c.env.DB, id);
  if (!owner) return c.body(null, 404);
  if (owner.memberId !== c.get('memberId')) return c.body(null, 403);

  await deleteInvitationById(c.env.DB, id);
  return c.body(null, 204);
});

export const onRequest = handle(app);
