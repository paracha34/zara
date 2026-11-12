import api, { type Env } from "../workers/api";

export const onRequest = async ({
  request,
  env,
  next,
}: {
  request: Request;
  env: Env;
  next: () => Promise<Response>;
}): Promise<Response> => {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) return next();
  return api.fetch(request, env);
};
