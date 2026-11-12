import api, { type Env } from "../workers/api";

export const onRequest: PagesFunction<Env> = async ({ request, env, next }) => {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) {
    return next();
  }
  return api.fetch(request, env);
};
