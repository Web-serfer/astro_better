import type { APIContext } from "astro";
import { auth } from "../../../lib/auth/auth";
import { APIError } from "better-auth/api";

interface SignUpRequestBody {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: boolean;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

export async function POST(context: APIContext): Promise<Response> {
  // --- Шаг 1: Чтение и парсинг тела запроса ---
  let body: SignUpRequestBody;
  try {
    body = await context.request.json();
  } catch (e) {
    return new Response(
      JSON.stringify({ message: "Неверный формат запроса (ожидается JSON)." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // --- Шаг 2: Серверная валидация данных ---
  const { name, email, password, confirmPassword, terms } = body;
  const errors: ValidationErrors = {};

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    errors.name = "Пожалуйста, введите ваше имя.";
  }
  if (
    !email ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    errors.email = "Неверный формат email.";
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    errors.password = "Пароль должен быть не менее 8 символов.";
  }
  if (password !== confirmPassword) {
    errors.confirmPassword = "Пароли не совпадают.";
  }
  if (terms !== true) {
    errors.terms = "Вы должны принять условия использования.";
  }

  // Если есть ошибки валидации, возвращаем их с кодом 400
  if (Object.keys(errors).length > 0) {
    return new Response(JSON.stringify({ errors }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // --- Шаг 3: регистрации пользователя через better-auth ---
  try {
    await auth.api.signUpEmail({
      body: {
        name: name!,
        email: email!,
        password: password!,
      },
    });
  } catch (error) {
    // Обрабатываем специфичные ошибки от библиотеки `better-auth`
    if (error instanceof APIError) {
      switch (error.status) {
        // Если пользователь уже существует
        case "UNPROCESSABLE_ENTITY":
          return new Response(
            JSON.stringify({
              errors: { email: "Пользователь с таким email уже существует." },
            }),
            {
              status: 409,
              headers: { "Content-Type": "application/json" },
            }
          );
        // Обработка других возможных ошибок от API
        default:
          return new Response(
            JSON.stringify({
              message: "Произошла ошибка при регистрации. Попробуйте позже.",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
      }
    }

    // Логируем непредвиденные ошибки на сервере для отладки
    console.error("Sign up with email and password has not worked", error);
    return new Response(
      JSON.stringify({ message: "Произошла внутренняя ошибка сервера." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // --- Шаг 4: Успешный ответ ---
  // В случае успеха возвращаем положительный ответ.
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
