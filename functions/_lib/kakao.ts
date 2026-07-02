export function buildAuthorizeUrl(restApiKey: string, redirectUri: string): string {
  const url = new URL('https://kauth.kakao.com/oauth/authorize');
  url.searchParams.set('client_id', restApiKey);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  return url.toString();
}

export async function exchangeCodeForToken(params: {
  code: string;
  redirectUri: string;
  restApiKey: string;
  clientSecret: string;
}): Promise<string> {
  const body = new URLSearchParams();
  body.set('grant_type', 'authorization_code');
  body.set('client_id', params.restApiKey);
  body.set('client_secret', params.clientSecret);
  body.set('redirect_uri', params.redirectUri);
  body.set('code', params.code);

  const res = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    throw new Error(`카카오 토큰 발급 실패: ${res.status}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error('카카오 토큰 발급 실패: access_token 없음');
  }
  return data.access_token;
}

export type KakaoUser = {
  id: number;
  nickname?: string;
  profileImageUrl?: string;
};

export async function fetchKakaoUser(accessToken: string): Promise<KakaoUser> {
  const res = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`카카오 사용자 정보 조회 실패: ${res.status}`);
  }
  const data = (await res.json()) as {
    id: number;
    kakao_account?: { profile?: { nickname?: string; profile_image_url?: string } };
  };
  const profile = data.kakao_account?.profile;
  return {
    id: data.id,
    nickname: profile?.nickname,
    profileImageUrl: profile?.profile_image_url,
  };
}
