import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import * as authApi from './auth.api';
import type { LoginInput, PublicUser } from './auth.types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  user: PublicUser | null;
  status: AuthStatus;
  signIn: (input: LoginInput) => Promise<PublicUser>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let isMounted = true;

    authApi
      .getCurrentUser()
      .then(({ user: currentUser }) => {
        if (!isMounted) return;

        setUser(currentUser);
        setStatus('authenticated');
      })
      .catch(() => {
        if (!isMounted) return;

        setUser(null);
        setStatus('unauthenticated');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = useCallback(async (input: LoginInput) => {
    const response = await authApi.login(input);

    setUser(response.user);
    setStatus('authenticated');

    return response.user;
  }, []);

  const signOut = useCallback(async () => {
    await authApi.logout();

    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      signIn,
      signOut,
    }),
    [user, status, signIn, signOut],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
