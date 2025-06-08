import { betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { sendEmail } from "../../lib/sendEmail";
import { openAPI, emailOTP } from "better-auth/plugins";
import {
  getVerificationEmailTemplate,
  verificationEmailSubject,
  getPasswordResetOtpTemplate,
  passwordResetOtpSubject,
} from "../../lib/email";

const prisma = new PrismaClient();

const requiredEnvVars = [
  "BETTER_AUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "VK_CLIENT_ID",
  "VK_CLIENT_SECRET",
  // "GITHUB_CLIENT_ID",
  // "GITHUB_CLIENT_SECRET",
  "EMAIL_VERIFICATION_CALLBACK_URL",
  "BETTER_AUTH_URL",
];

// Проверка наличия всех переменных
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Отсутствует обязательная переменная окружения: ${envVar}`);
  }
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  databaseHooks: {
    user: {
      create: {
        before: async (user, context) => {
          // --- НАЧАЛО ДИАГНОСТИЧЕСКОГО БЛОКА ---
          console.log("🔍 [HOOK `user.create.before`] ЗАПУЩЕН");

          // Убедимся, что context существует, чтобы избежать ошибок
          if (!context) {
            console.log("❌ Контекст не определен. Хук завершает работу.");
            return;
          }

          const provider = context.provider;
          const profile = context.profile as any;

          console.log(`PROVIDER: [${provider}]`);
          console.log("PROFILE OBJECT:", JSON.stringify(profile, null, 2));

          let image = user.image;

          if (provider === "google" && profile.picture) {
            console.log(
              "✅ Условие для Google сработало. Найдена ссылка на аватар."
            );
            image = profile.picture;
          } else if (provider === "vk" && profile.photo_200_orig) {
            console.log(
              "✅ Условие для VK сработало. Найдена ссылка на аватар."
            );
            image = profile.photo_200_orig;
          } else {
            console.log("❌ Ни одно из условий для аватара не сработало.");
          }

          console.log(`➡️ Итоговое значение для 'image': ${image}`);
          console.log("🔍 [HOOK `user.create.before`] ЗАВЕРШЕН");
          // --- КОНЕЦ ДИАГНОСТИЧЕСКОГО БЛОКА ---

          return {
            data: {
              ...user, // Оригинальные данные пользователя
              image: image, // Наша новая ссылка на аватар
            },
          };
        },
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },

  // Верификация по ссылке при регистрации.
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: false,
    sendVerificationEmail: async ({ user, token }) => {
      const verificationUrl = `${process.env.BETTER_AUTH_URL}/email-verified?token=${token}`;
      await sendEmail({
        to: user.email,
        subject: verificationEmailSubject,
        text: `Для подтверждения email перейдите по ссылке: ${verificationUrl}`,
        html: getVerificationEmailTemplate(verificationUrl),
      });
    },
  },

  plugins: [
    openAPI(),
    emailOTP({
      otpLength: 6,
      expiresIn: 300, // 5 минут
      allowedAttempts: 3,
      async sendVerificationOTP({ email, otp, type }) {
        let subject: string;
        let htmlContent: string;
        let textContent: string;

        // Логика для отправки разных писем в зависимости от типа OTP
        switch (type) {
          case "sign-in":
            subject = `Ваш код для входа: ${otp}`;
            htmlContent = `<p>Ваш одноразовый код для входа: <strong>${otp}</strong></p><p>Он действителен в течение 5 минут.</p>`;
            textContent = `Ваш одноразовый код для входа: ${otp}. Он действителен в течение 5 минут.`;
            break;

          case "email-verification":
            subject = `Ваш код для подтверждения email: ${otp}`;
            htmlContent = `<p>Ваш одноразовый код для подтверждения email: <strong>${otp}</strong></p><p>Он действителен в течение 5 минут.</p>`;
            textContent = `Ваш одноразовый код для подтверждения email: ${otp}. Он действителен в течение 5 минут.`;
            break;

          case "forget-password":
            // Используем специализированный шаблон для сброса пароля
            subject = passwordResetOtpSubject;
            htmlContent = getPasswordResetOtpTemplate(otp);
            textContent = `Ваш одноразовый код для сброса пароля: ${otp}. Используйте его на странице сброса пароля. Код действителен 5 минут.`;
            break;

          default:
            subject = `Ваш OTP: ${otp}`;
            htmlContent = `<p>Ваш одноразовый код: <strong>${otp}</strong></p><p>Он действителен в течение 5 минут.</p>`;
            textContent = `Ваш одноразовый код: ${otp}. Он действителен в течение 5 минут.`;
        }

        // Используем вашу функцию sendEmail
        await sendEmail({
          to: email,
          subject,
          text: textContent,
          html: htmlContent,
        });
      },
    }),
  ],

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    // github: {
    //   clientId: process.env.GITHUB_CLIENT_ID as string,
    //   clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    // },
    vk: {
      clientId: process.env.VK_CLIENT_ID as string,
      clientSecret: process.env.VK_CLIENT_SECRET as string,
    },
  },

  session: {
    expiresIn: 30 * 24 * 60 * 60, // 30 дней
    updateAge: 24 * 60 * 60, // 1 день
  },
} satisfies BetterAuthOptions);
