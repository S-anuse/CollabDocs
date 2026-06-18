import { createContext, useState , useEffect } from "react";
import api from "../api/axios";

export const AuthContext = createContext() ;

export function AuthProvider({ children }) {
    const [accessToken , setAccessToken] = useState(null) ;
    const [user , setUser] = useState(null) ;
    const [loading , setLoading] = useState(true) ;

    useEffect(() => {
      const refreshAccessToken = async () => {
        try {
          const response = await api.post("/refreshToken");

          const token = response.data.accessToken;

          setAccessToken(token);

          const profileResponse = await api.get("/profile", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          setUser(profileResponse.data);
        } 
        catch (err) {
          setAccessToken(null);
          setUser(null);
        } 
        finally {
          setLoading(false);
        }
      };

      refreshAccessToken();
    }, []);

    const value = {
      accessToken,
      setAccessToken,
      user,
      setUser,
      loading,
      setLoading,
    };

    return (
      <AuthContext.Provider value={value} >
        {children}
      </AuthContext.Provider>
    )


}