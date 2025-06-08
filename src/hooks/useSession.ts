import { useState, useEffect } from "react";
import axios from "axios"; 

/
interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
}

interface Session {
  id:string;
  expiresAt: string;
  userId: string;
}

interface SessionData {
  user: User;
  session: Session;
}

export function useSession() {
  const [data, setData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);  
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      setError(null);
      setIsLoading(true);

      try {
        
        const response = await axios.get<SessionData>("/api/auth/get-session");        
        
        setData(response.data);

      } catch (err: unknown) { 
        if (axios.isAxiosError(err)) {         
          if (err.response?.status === 401 || err.response?.status === 404) {
            setData(null); 
          } else {
            
            console.error("Ошибка при получении сессии (сервер):", err);
            setError(new Error(err.response?.data?.message || err.message));
          }
        } else if (err instanceof Error) {            
            console.error("Ошибка при получении сессии (клиент):", err);
            setError(err);
        } else {            
            setError(new Error("Произошла неизвестная ошибка"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, []);

  return { data, isLoading, error };
}