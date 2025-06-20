import React, { useState, useEffect } from "react";
import axios from "axios";

import { authClient, useSession } from "@lib/auth/auth-client";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FaVk } from "react-icons/fa";
import { ImSpinner8 } from "react-icons/im";

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

interface SignInFormProps {
  dashboardPath?: string;
}

export default function SignInForm({
  dashboardPath = "/dashboard",
}: SignInFormProps) {
  const { data: session, isPending: isSessionLoading } = useSession();

  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const [generalMessage, setGeneralMessage] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  // const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isVkLoading, setIsVkLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      window.location.href = dashboardPath;
    }
  }, [session, dashboardPath]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});
    setGeneralMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const rememberMe = formData.get("remember-me") === "on";

    try {
      await authClient.signIn.email({
        email,
        password,
        rememberMe,
      });
      window.location.href = dashboardPath;
    } catch (error) {
      const message = getErrorMessage(error);
      setFormErrors({ general: message });
      setGeneralMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialSignIn = async (provider: "google" | "vk") => {
    if (provider === "google") setIsGoogleLoading(true);
    if (provider === "vk") setIsVkLoading(true);
    // if (provider === "github") setIsGithubLoading(true);

    try {
      await authClient.signIn.social({
        provider: provider,
        callbackURL: `${window.location.origin}${dashboardPath}`,
      });
    } catch (error) {
      const message = getErrorMessage(error);
      setFormErrors({ general: message });
      setGeneralMessage(message);

      if (provider === "google") setIsGoogleLoading(false);
      if (provider === "vk") setIsVkLoading(false);
      // if (provider === "github") setIsGithubLoading(false);
    }
  };

  if (isSessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <ImSpinner8 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Вход в систему
          </h2>
        </div>

        <div className="rounded-lg bg-white px-8 py-8 shadow">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {generalMessage && (
              <p
                className={`p-3 rounded-md text-center ${
                  formErrors.general
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : "bg-green-100 text-green-700 border border-green-200"
                }`}
              >
                {generalMessage}
              </p>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-md border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="your@email.com"
                />
              </div>
              {formErrors.email && (
                <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Пароль
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-md border-gray-300 px-3 py-2 pr-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label="Показать или скрыть пароль"
                >
                  {showPassword ? (
                    <AiOutlineEyeInvisible className="h-5 w-5" />
                  ) : (
                    <AiOutlineEye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Запомнить меня
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="/forget-password"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Забыли пароль?
                </a>
              </div>
            </div>

            <button
              type="submit"
              className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <ImSpinner8 className="mr-2 h-5 w-5 animate-spin" />
                  Входим...
                </span>
              ) : (
                "Войти"
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">
                  Или войти через
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSocialSignIn("google")}
                disabled={isGoogleLoading || isVkLoading || isSubmitting}
                className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer"
              >
                {isGoogleLoading ? (
                  <ImSpinner8 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <svg
                      className="mr-2 h-5 w-5"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span>Google</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSocialSignIn("vk")}
                disabled={isVkLoading || isGoogleLoading || isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer"
              >
                {isVkLoading ? (
                  <ImSpinner8 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <FaVk className="mr-2 h-5 w-5" />
                    <span>ВКонтакте</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            Ещё нет аккаунта?{" "}
            <a
              href="/sign-up"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Зарегистрироваться
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
