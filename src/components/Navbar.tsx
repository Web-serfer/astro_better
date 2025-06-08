import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import { useSession } from "../hooks/useSession";

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Произошла неизвестная ошибка";
};

const Navbar: React.FC = () => {
  const { data: sessionData, isLoading } = useSession();
  const user = sessionData?.user;
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await axios.post("/api/auth/sign-out");
      window.location.href = "/";
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("Ошибка выхода:", message);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isLoading) {
    return (
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="text-xl font-bold text-gray-800">
          <Link href="/">AuthApp</Link>
        </div>
        <div className="text-sm text-gray-500">Проверка сессии...</div>
      </nav>
    );
  }

  const hasAvatar = user?.image && !avatarError;

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
      <div className="text-xl font-bold text-gray-800">
        <Link href="/">AuthApp</Link>
      </div>

      <div className="flex items-center space-x-4">
        {user ? (
          <div className="flex items-center gap-4">
            <div className="relative">
              {hasAvatar ? (
                <img
                  src={user.image}
                  alt="Аватар пользователя"
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                  width={40}
                  height={40}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center">
                  <UserIcon />
                </div>
              )}
              <div
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-green-500"
                title="В сети"
              ></div>
            </div>

            <div className="hidden flex-col text-right sm:flex">
              <span className="text-sm font-medium text-gray-800">
                {user.name || "Пользователь"}
              </span>
              <span className="text-xs text-gray-500">{user.email}</span>
            </div>

            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="p-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer"
              aria-label="Выйти"
              title="Выйти"
            >
              {isSigningOut ? <Spinner /> : <LogoutIcon />}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <AuthLink href="/sign-in">Войти</AuthLink>
            <AuthLink href="/sign-up" primary>
              Регистрация
            </AuthLink>
          </div>
        )}
      </div>
    </nav>
  );
};

// --- Вспомогательные компоненты (остаются без изменений) ---

const Link = ({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <a href={href} className={className}>
    {children}
  </a>
);

const UserIcon = () => (
  <svg
    className="w-6 h-6 text-gray-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const LogoutIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

const Spinner = () => (
  <svg
    className="animate-spin h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const AuthLink = ({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) => (
  <a
    href={href}
    className={`px-4 py-2 rounded-md transition-colors duration-200 text-sm font-medium ${
      primary
        ? "bg-indigo-600 text-white hover:bg-indigo-700"
        : "text-gray-700 hover:bg-gray-100"
    }`}
  >
    {children}
  </a>
);

export default Navbar;
