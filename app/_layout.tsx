import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Auth navigation guard component
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      console.log('Auth loading, waiting...');
      return;
    }

    // Check if the current path is in the auth group
    const inAuthGroup = segments[0] === ('auth' as any);

    // Define protected routes that require authentication
    const isProtectedRoute = () => {
      // Report screen requires authentication
      if (segments[0] === '(tabs)' && segments[1] === 'report') {
        return true;
      }

      // User profile would require authentication (if implemented)
      if (segments[0] === '(tabs)' && segments[1] === 'profile') {
        return true;
      }

      // Any routes under /reports/ that modify reports require authentication
      if (segments[0] === 'reports' && segments.length > 1) {
        return true;
      }

      return false;
    };

    console.log('Auth state:', {
      isAuthenticated,
      inAuthGroup,
      currentSegment: segments[0],
      secondSegment: segments[1],
      isProtectedRoute: isProtectedRoute(),
      hasUser: !!user
    });

    if (!isAuthenticated && isProtectedRoute()) {
      // Redirect to login only if trying to access a protected route
      console.log('Not authenticated and trying to access protected route, redirecting to login');
      router.replace('/auth/login' as any);
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home if authenticated and trying to access auth screens
      console.log('Authenticated, redirecting to home');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isLoading, user]);

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthGuard>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
                paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0
              },
              animation: 'slide_from_right',
              headerStyle: {
                backgroundColor: colorScheme === 'dark' ? '#000' : '#fff'
              },
              headerTintColor: colorScheme === 'dark' ? '#fff' : '#000',
              headerShadowVisible: false
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </AuthGuard>
      </ThemeProvider>
    </AuthProvider>
  );
}
