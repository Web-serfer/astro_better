import { useEffect, useState } from "react";
import axios from "axios";
import { ImSpinner8 } from "react-icons/im";
import { FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

export const prerender = false;

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

export default function VerifyEmail() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        setStatus("error");
        setErrorMessage("Отсутствует токен подтверждения");
        return;
      }

      try {
        await axios.get(`/api/auth/verify-email`, {
          params: { token },
        });

        setStatus("success");
        setTimeout(() => {
          window.location.href = "/sign-in";
        }, 5000);
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");

        let message = "Неизвестная ошибка при подтверждении email";

        if (axios.isAxiosError<ApiErrorResponse>(error)) {
          const serverError = error.response?.data;
          message = serverError?.error || serverError?.message || error.message;
        } else if (error instanceof Error) {
          message = error.message;
        }

        setErrorMessage(message);
      }
    };

    verifyToken();
  }, []);

  const handleRedirect = (path: string) => {
    window.location.href = path;
  };

  const renderContent = () => {
    switch (status) {
      case "success":
        return (
          <div className="text-center py-8">
            <FaCheckCircle className="mx-auto text-green-500 text-5xl mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Email успешно подтверждён!
            </h2>
            <p className="text-gray-600 mb-6">
              Ваш адрес электронной почты был успешно подтверждён. Теперь вы
              можете войти в систему.
            </p>
            <div className="text-sm text-gray-500">
              <p>Перенаправление на страницу входа через 5 секунд...</p>
              <button
                onClick={() => handleRedirect("/sign-in")}
                className="mt-4 inline-block px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition hover:cursor-pointer"
              >
                Перейти сейчас
              </button>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="text-center py-8">
            <FaExclamationTriangle className="mx-auto text-yellow-500 text-5xl mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Ошибка подтверждения
            </h2>
            <p className="text-red-600 mb-4">{errorMessage}</p>
            <div className="space-y-3">
              <p className="text-gray-600">Возможные причины:</p>
              <ul className="text-left max-w-md mx-auto text-gray-600 list-disc pl-5">
                <li>Ссылка устарела (срок действия 24 часа)</li>
                <li>Некорректный токен подтверждения</li>
                <li>Аккаунт уже был подтверждён ранее</li>
              </ul>
              <div className="pt-4">
                <button
                  onClick={() => handleRedirect("/sign-up")}
                  className="mr-3 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 hover:cursor-pointer"
                >
                  Регистрация
                </button>
                <button
                  onClick={() => handleRedirect("/sign-in")}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 hover:cursor-pointer"
                >
                  Войти
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <ImSpinner8 className="mx-auto text-indigo-600 text-4xl animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-gray-800">
              Подтверждаем ваш email...
            </h2>
            <p className="text-gray-600 mt-2">Пожалуйста, подождите</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-xl w-full bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Подтверждение Email
          </h1>
        </div>
        {renderContent()}
      </div>
    </div>
  );
}
