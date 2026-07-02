export type Bindings = {
  DB: D1Database;
  ASSETS: { fetch: typeof fetch };
  KAKAO_REST_API_KEY: string;
  KAKAO_CLIENT_SECRET: string;
  SESSION_SECRET: string;
};
