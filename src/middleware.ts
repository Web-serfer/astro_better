import { defineMiddleware } from "astro:middleware";
import { auth } from "@lib/auth/auth";

export const onRequest = defineMiddleware(async (context, next) => {
  // Этот лог должен появиться при КАЖДОМ запросе (к странице, картинке, api)
  console.log(`\n🚀 MIDDLEWARE EXECUTED for path: ${context.url.pathname}`);

  try {
    const sessionData = await auth.api.getSession({
      headers: context.request.headers,
    });

    if (sessionData) {
      console.log(
        `✅ Session found in middleware for user: ${sessionData.user.email}`
      );
      context.locals.user = sessionData.user;
      context.locals.session = sessionData.session;
    } else {
      console.log("❌ No session found in middleware.");
      context.locals.user = null;
      context.locals.session = null;
    }
  } catch (e: any) {
    console.error("🔥 ERROR in middleware:", e.message);
    // На случай ошибки все равно обнуляем locals
    context.locals.user = null;
    context.locals.session = null;
  }

  console.log(
    "➡️ Middleware finished, passing to next(). Locals:",
    context.locals
  );
  return next();
});
