import { defineMiddleware } from "astro:middleware";
import { auth } from "@lib/auth/auth";

export const onRequest = defineMiddleware(async (context, next) => {
  // Этот лог по-прежнему будет появляться при КАЖДОМ запросе
  console.log(`\n🚀 MIDDLEWARE EXECUTED for path: ${context.url.pathname}`);

  // --- ШАГ 1: Проверка сессии ---
  // Этот блок определяет, залогинен ли пользователь, и помещает его данные в context.locals
  try {
    const sessionData = await auth.api.getSession({
      headers: context.request.headers,
    });

    if (sessionData) {
      console.log(`✅ Session found for user: ${sessionData.user.email}`);
      context.locals.user = sessionData.user;
      context.locals.session = sessionData.session;
    } else {
      console.log("❌ No session found.");
      context.locals.user = null;
      context.locals.session = null;
    }
  } catch (e: any) {
    console.error("🔥 ERROR in middleware while checking session:", e.message);
    context.locals.user = null;
    context.locals.session = null;
  }

  // --- ШАГ 2: Защита роутов (новая логика) ---
  // Здесь мы решаем, что делать с запросом на основе данных из Шага 1.

  const pathname = context.url.pathname;

  // Проверяем, пытается ли пользователь получить доступ к защищенной области
  // .startsWith() защищает /dashboard, /dashboard/settings, /dashboard/api и т.д.
  if (pathname.startsWith("/dashboard")) {
    // Если пользователь пытается зайти в /dashboard, но его нет в locals (т.е. он не залогинен)
    if (!context.locals.user) {
      console.log(
        `🚫 Access DENIED to protected route ${pathname}. Redirecting to /login.`
      );
      // Прерываем выполнение и перенаправляем на страницу входа.
      // Важно: мы возвращаем redirect и НЕ вызываем next().
      return context.redirect("/sign-in");
    }
  }

  // --- ШАГ 3: Продолжение выполнения ---
  // Если мы дошли до этого места, значит, доступ разрешен.
  // Это произойдет, если:
  // 1. Пользователь заходит на публичную страницу (не /dashboard).
  // 2. Пользователь заходит на /dashboard и он УЖЕ залогинен.
  console.log(`➡️ Access GRANTED to ${pathname}. Passing to next().`);
  return next();
});
