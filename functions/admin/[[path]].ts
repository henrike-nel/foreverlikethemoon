import { accessAllowed } from "../_lib/access";
import type { Env } from "../_lib/index";

export const onRequest: PagesFunction<Env> = async (context) => {
  if (!(await accessAllowed(context.request, context.env))) {
    return new Response(
      JSON.stringify({ error: "Sign in through Cloudflare Access" }),
      {
        status: 401,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      },
    );
  }
  return context.next();
};
