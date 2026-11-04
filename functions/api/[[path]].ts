import { handle, type Env } from "../_lib/index";

export const onRequest: PagesFunction<Env> = (context) =>
  handle(context.request, context.env);
