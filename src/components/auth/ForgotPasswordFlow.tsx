import axios from "axios";
import React, { useState, useEffect } from "react";

interface ApiError {
  message?: string;
  error?: string;
}

const getErrorMessage = (error: unknown): string => {
  const defaultMessage = "Произошла неизвестная ошибка. Попробуйте снова.";

  if (axios.isAxiosError<ApiError>(error)) {
    const serverError = error.response?.data;
    return serverError?.message || serverError?.error || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return defaultMessage;
};

type StatusState = {
  message: string | null;
  error: string | null;
};

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`p-3 text-white rounded-md text-base transition-colors ${
        pending
          ? "bg-gray-500 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
      }`}
    >
      {pending ? "Идет поиск..." : "Найти аккаунт"}
    </button>
  );
}

function ResetSubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`p-3 text-white rounded-md text-base transition-colors ${
        pending
          ? "bg-gray-500 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
      }`}
    >
      {pending ? "Обработка..." : "Сбросить пароль"}
    </button>
  );
}

function ResetPasswordForm({ email }: { email: string }) {
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [status, setStatus] = useState<StatusState>({
    message: null,
    error: null,
  });

  useEffect(() => {
    if (status.message) {
      const timer = setTimeout(() => {
        window.location.href = "/sign-in";
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status.message]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus({ message: null, error: null });

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const otp = formData.get("otp") as string;

    if (password !== confirmPassword) {
      setPasswordsMatch(false);
      return;
    }
    setPasswordsMatch(true);
    setIsResetting(true);

    try {
      await axios.post("/api/auth/otp/reset-password", {
        email: email,
        otp: otp,
        password: password,
      });

      setStatus({
        message: "Пароль успешно сброшен! Перенаправляем на страницу входа...",
        error: null,
      });
    } catch (error) {
      const message = getErrorMessage(error);
      setStatus({
        message: null,
        error:
          message ||
          "Не удалось сбросить пароль. Код может быть неверным или срок его действия истек.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="mb-2 text-gray-600 text-sm">
        Ссылка/код для сброса пароля отправлена на адрес{" "}
        <span className="font-medium text-gray-800">{email}</span>. Пожалуйста,
        проверьте вашу почту.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label
            htmlFor="otp"
            className="block mb-2 font-medium text-gray-800 text-left"
          >
            Код из письма (OTP)
          </label>
          <input
            type="text"
            id="otp"
            name="otp"
            placeholder="Введите 6-значный код"
            required
            pattern="\d{6}"
            title="Пожалуйста, введите 6-значный код"
            className="w-full p-3 border border-gray-300 rounded-md text-base"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block mb-2 font-medium text-gray-800 text-left"
          >
            Новый пароль
          </label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Введите новый пароль (минимум 8 символов)"
            required
            minLength={8}
            className="w-full p-3 border border-gray-300 rounded-md text-base"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block mb-2 font-medium text-gray-800 text-left"
          >
            Подтвердите пароль
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Подтвердите новый пароль"
            required
            minLength={8}
            className="w-full p-3 border border-gray-300 rounded-md text-base"
            onChange={() => setPasswordsMatch(true)}
          />
        </div>

        {!passwordsMatch && (
          <p className="text-red-500 text-sm">Пароли не совпадают</p>
        )}
        {status.error && (
          <p className="p-3 rounded-md text-sm text-red-700 bg-red-100 border border-red-200">
            {status.error}
          </p>
        )}
        {status.message && (
          <p className="p-3 rounded-md text-sm text-green-700 bg-green-100 border border-green-200">
            {status.message}
          </p>
        )}
        <ResetSubmitButton pending={isResetting} />
      </form>
    </div>
  );
}

export default function ForgotPasswordFlow() {
  const [email, setEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [status, setStatus] = useState<StatusState>({
    message: null,
    error: null,
  });

  const handleSearchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSearching(true);
    setStatus({ message: null, error: null });

    try {
      await axios.post("/api/auth/otp/send", {
        email,
        type: "forget-password",
      });
      setShowResetForm(true);
    } catch (error) {
      const message = getErrorMessage(error);
      setStatus({
        message: null,
        error: message || "Не удалось найти аккаунт с таким email.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-white p-10 rounded-lg shadow-md max-w-md w-full text-center">
      <h2 className="text-2xl mb-5 text-gray-800 font-bold">
        {showResetForm ? "Сбросьте ваш пароль" : "Поиск аккаунта"}
      </h2>

      {showResetForm ? (
        <ResetPasswordForm email={email} />
      ) : (
        <>
          <p className="mb-7 text-gray-600 text-sm">
            Введите ваш email, чтобы получить ссылку/код для сброса пароля.
          </p>
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-5">
            <div>
              <label
                htmlFor="email"
                className="block mb-2 font-medium text-gray-800 text-left"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full p-3 border border-gray-300 rounded-md text-base"
              />
            </div>

            {status.error && (
              <p className="p-3 rounded-md text-sm text-red-700 bg-red-100 border border-red-200">
                {status.error}
              </p>
            )}
            <SubmitButton pending={isSearching} />
          </form>
        </>
      )}
    </div>
  );
}
