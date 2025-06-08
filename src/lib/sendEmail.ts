import nodemailer from "nodemailer";

interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: EmailPayload) {
  const isDev = process.env.NODE_ENV === "development";

  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT) {
    const errorMsg = "Переменные окружения SMTP_HOST и SMTP_PORT не заданы!";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Когда вы раскомментируете блок Gmail в .env, здесь будет false
  const useMailDev = isDev && process.env.SMTP_HOST === "localhost";

  // Nodemailer создаст транспортер с данными для Gmail
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),

    // Это выражение станет true (465 === 465)
    secure: Number(process.env.SMTP_PORT) === 465,

    // Так как useMailDev будет false, этот блок будет выполнен.
    // Nodemailer будет использовать логин и пароль для Gmail из .env
    auth: !useMailDev
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        }
      : undefined,

    // Так как useMailDev будет false, логирование будет отключено (что правильно для продакшена)
    logger: useMailDev,
  });

  try {
    const info = await transporter.sendMail({
      // Сюда подставятся данные для Gmail из .env
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      text,
      html: html || text,
    });

    console.log(
      `✅ Email успешно отправлен на ${to}. ID сообщения:`,
      info.messageId
    );
  } catch (error) {
    console.error("❌ Ошибка при отправке email:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Неизвестная ошибка при отправке email"
    );
  }
}
