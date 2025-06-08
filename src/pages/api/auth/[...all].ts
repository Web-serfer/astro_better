import { auth } from "../../../lib/auth/auth";
import type { APIRoute } from "astro";

console.log("✅ [HANDLER] Файл [...all].ts загружен!"); // <-- ДОБАВИТЬ ЭТОТ ЛОГ

export const ALL: APIRoute = async (ctx) => {
  // <-- ДОБАВИТЬ ЭТИ ЛОГИ
  console.log(
    `➡️ [HANDLER] Получен запрос: ${ctx.request.method} ${ctx.request.url}`
  );
  return auth.handler(ctx.request);
};
