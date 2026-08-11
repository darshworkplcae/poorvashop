import { createContext, useContext, useState, useEffect } from 'react';
import { getSession, logout as doLogout } from '../lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    setUser(session);
    setLoading(false);
  }, []);

  function refreshUser() {
    setUser(getSession());
  }

  async function logout() {
    await doLogout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
