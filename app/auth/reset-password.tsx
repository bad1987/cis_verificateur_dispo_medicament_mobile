import { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, Link, router, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import authService from '@/services/authService';

export default function ResetPasswordScreen() {
  const { email, code } = useLocalSearchParams<{ email: string, code: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!email || !code) {
      Alert.alert(
        'Invalid Request',
        'Missing email or verification code. Please request a new verification code.',
        [{ text: 'OK', onPress: () => router.replace('/auth/forgot-password' as any) }]
      );
    }
  }, [email, code]);

  const handleResetPassword = async () => {
    if (!email || !code) {
      Alert.alert('Error', 'Missing email or verification code');
      return;
    }

    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await authService.resetPassword({
        email,
        code,
        password
      });
      setSuccessMessage(response.message);
    } catch (error) {
      Alert.alert(
        'Reset Failed',
        error instanceof Error ? error.message : 'An error occurred during password reset'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t('resetPassword'),
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors[colorScheme].background
          },
          headerTintColor: Colors[colorScheme].text,
        }}
      />
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Create New Password
        </ThemedText>

        {successMessage ? (
          <ThemedView style={styles.successContainer}>
            <ThemedText style={styles.successText}>{successMessage}</ThemedText>
            <Link href="/auth/login" asChild>
              <TouchableOpacity style={styles.button}>
                <ThemedText style={styles.buttonText}>Go to Login</ThemedText>
              </TouchableOpacity>
            </Link>
          </ThemedView>
        ) : (
          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.instructions}>
              Enter the verification code and your new password below.
            </ThemedText>

            <TextInput
              style={styles.input}
              placeholder="Verification Code"
              value={code}
              editable={false}
              selectTextOnFocus
            />

            <TextInput
              style={styles.input}
              placeholder="New Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleResetPassword}
              disabled={isSubmitting || !email || !code}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.buttonText}>Reset Password</ThemedText>
              )}
            </TouchableOpacity>

            <ThemedView style={styles.loginContainer}>
              <ThemedText>Remember your password? </ThemedText>
              <Link href="/auth/login" asChild>
                <TouchableOpacity>
                  <ThemedText style={styles.loginText}>Login</ThemedText>
                </TouchableOpacity>
              </Link>
            </ThemedView>
          </ThemedView>
        )}
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  instructions: {
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#2196F3',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  successContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    alignItems: 'center',
  },
  successText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
});
