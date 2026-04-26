import { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_USER } from '../data/mock';

const AuthContext = createContext(null);

// Toggle USE_MOCK to false once Supabase credentials are configured
const USE_MOCK = true;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (USE_MOCK) {
      setUser(null);
      setLoading(false);
      return;
    }
    // TODO: supabase.auth.getSession() + onAuthStateChange
  }, []);

  const signIn = async (email, password) => {
    if (USE_MOCK) {
      setUser(MOCK_USER);
      return { error: null };
    }
    // TODO: supabase.auth.signInWithPassword
  };

  const signUp = async (email, password, name) => {
    if (USE_MOCK) {
      setUser({ ...MOCK_USER, name });
      return { error: null };
    }
    // TODO: supabase.auth.signUp + profiles insert
  };

  const signOut = async () => {
    setUser(null);
    if (!USE_MOCK) {
      // TODO: supabase.auth.signOut()
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
