import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import authService, {
  User,
  LoginCredentials,
  RegisterCredentials
} from '@/services/authService';

// Define the shape of our context
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  error: null,
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true);
        const authenticated = await authService.isAuthenticated();
        setIsAuthenticated(authenticated);

        if (authenticated) {
          const userData = await authService.getCurrentUser();

          if (userData) {
            setUser(userData);
            console.log('User authenticated:', userData.username);
          } else {
            console.warn('Token exists but user data not found');
            // If we have a token but no user data, we should logout and force re-login
            await authService.logout();
            setIsAuthenticated(false);
          }
        } else {
          console.log('User not authenticated');
        }
      } catch (err) {
        console.error('Auth status check error:', err);
        setError('Failed to check authentication status');
        // On error, clear auth state to be safe
        await authService.logout();
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.login(credentials);

      if (response && response.user && response.token) {
        setUser(response.user);
        setIsAuthenticated(true);
        console.log('Login successful for user:', response.user.username);
      } else {
        console.error('Login response missing user or token data');
        setError('Invalid login response from server');
        throw new Error('Invalid login response from server');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (credentials: RegisterCredentials) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Attempting to register user:', credentials.username);
      const registerResponse = await authService.register(credentials);

      if (registerResponse && registerResponse.message) {
        console.log('Registration successful, attempting login');
        // After registration, log the user in
        await login({
          email: credentials.email,
          password: credentials.password
        });
      } else {
        console.error('Registration response invalid');
        setError('Invalid registration response from server');
        throw new Error('Invalid registration response from server');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
