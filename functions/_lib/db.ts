export type Member = {
  id: number;
  kakaoId: number;
  nickname: string | null;
  profileImageUrl: string | null;
};

export async function findOrCreateMember(
  db: D1Database,
  kakaoId: number,
  nickname?: string,
  profileImageUrl?: string
): Promise<Member> {
  const existing = await db
    .prepare('SELECT id, kakao_id as kakaoId, nickname, profile_image_url as profileImageUrl FROM members WHERE kakao_id = ?')
    .bind(kakaoId)
    .first<Member>();

  if (existing) {
    await db
      .prepare('UPDATE members SET nickname = ?, profile_image_url = ? WHERE id = ?')
      .bind(nickname ?? existing.nickname, profileImageUrl ?? existing.profileImageUrl, existing.id)
      .run();
    return { ...existing, nickname: nickname ?? existing.nickname, profileImageUrl: profileImageUrl ?? existing.profileImageUrl };
  }

  const result = await db
    .prepare('INSERT INTO members (kakao_id, nickname, profile_image_url) VALUES (?, ?, ?)')
    .bind(kakaoId, nickname ?? null, profileImageUrl ?? null)
    .run();
  const id = Number(result.meta.last_row_id);
  return { id, kakaoId, nickname: nickname ?? null, profileImageUrl: profileImageUrl ?? null };
}

export async function getMemberById(db: D1Database, id: number): Promise<Member | null> {
  const row = await db
    .prepare('SELECT id, kakao_id as kakaoId, nickname, profile_image_url as profileImageUrl FROM members WHERE id = ?')
    .bind(id)
    .first<Member>();
  return row ?? null;
}

function generateSlug(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  let slug = '';
  for (let i = 0; i < 10; i++) {
    slug += alphabet[bytes[i] % alphabet.length];
  }
  return slug;
}

async function uniqueSlug(db: D1Database): Promise<string> {
  for (;;) {
    const slug = generateSlug();
    const exists = await db.prepare('SELECT 1 FROM invitations WHERE slug = ?').bind(slug).first();
    if (!exists) return slug;
  }
}

export type InvitationInput = {
  theme: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  contentJson: string;
};

export async function createInvitation(db: D1Database, memberId: number, data: InvitationInput) {
  const slug = await uniqueSlug(db);
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      `INSERT INTO invitations (slug, member_id, theme, groom_name, bride_name, wedding_date, content_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(slug, memberId, data.theme, data.groomName, data.brideName, data.weddingDate, data.contentJson, now, now)
    .run();
  return { id: Number(result.meta.last_row_id), slug };
}

export async function updateInvitation(db: D1Database, id: number, data: InvitationInput): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `UPDATE invitations SET theme = ?, groom_name = ?, bride_name = ?, wedding_date = ?, content_json = ?, updated_at = ?
       WHERE id = ?`
    )
    .bind(data.theme, data.groomName, data.brideName, data.weddingDate, data.contentJson, now, id)
    .run();
}

export async function getInvitationOwner(db: D1Database, id: number): Promise<{ memberId: number; slug: string } | null> {
  const row = await db
    .prepare('SELECT member_id as memberId, slug FROM invitations WHERE id = ?')
    .bind(id)
    .first<{ memberId: number; slug: string }>();
  return row ?? null;
}

export type InvitationDetail = { theme: string | null; contentJson: string };

export async function getInvitationById(db: D1Database, id: number): Promise<InvitationDetail | null> {
  const row = await db
    .prepare('SELECT theme, content_json as contentJson FROM invitations WHERE id = ?')
    .bind(id)
    .first<InvitationDetail>();
  return row ?? null;
}

export async function getInvitationBySlug(db: D1Database, slug: string): Promise<InvitationDetail | null> {
  const row = await db
    .prepare('SELECT theme, content_json as contentJson FROM invitations WHERE slug = ?')
    .bind(slug)
    .first<InvitationDetail>();
  return row ?? null;
}

export type InvitationSummary = {
  id: number;
  slug: string;
  theme: string | null;
  groomName: string | null;
  brideName: string | null;
  weddingDate: string | null;
  updatedAt: string;
};

export async function listInvitationsByMember(db: D1Database, memberId: number): Promise<InvitationSummary[]> {
  const { results } = await db
    .prepare(
      `SELECT id, slug, theme, groom_name as groomName, bride_name as brideName, wedding_date as weddingDate, updated_at as updatedAt
       FROM invitations WHERE member_id = ? ORDER BY updated_at DESC`
    )
    .bind(memberId)
    .all<InvitationSummary>();
  return results;
}

export async function deleteInvitationById(db: D1Database, id: number): Promise<void> {
  await db.prepare('DELETE FROM invitations WHERE id = ?').bind(id).run();
}
