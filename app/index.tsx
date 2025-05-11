import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return null;
  }

  // Always redirect to tabs - authentication will be checked for protected routes
  return <Redirect href="/(tabs)" />;
}
