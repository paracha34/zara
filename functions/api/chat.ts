import api, { type Env } from "../../workers/api";

export const onRequest = async ({
  request,
  env,
}: {
  request: Request;
  env: Env;
}): Promise<Response> => {
  return api.fetch(request, env);
};
