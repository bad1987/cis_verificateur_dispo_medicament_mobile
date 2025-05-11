import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, Link, router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import authService from '@/services/authService';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await authService.forgotPassword(email);
      setSuccessMessage(response.message);

      // In development, we can show the verification code for testing
      if (response.verificationCode) {
        console.log('Verification Code:', response.verificationCode);
        // Navigate to reset password screen with email and code for testing purposes
        router.push({
          pathname: '/auth/reset-password' as any,
          params: {
            email: email,
            code: response.verificationCode
          }
        });
      }
    } catch (error) {
      Alert.alert(
        'Request Failed',
        error instanceof Error ? error.message : 'An error occurred during password reset request'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t('forgotPassword'),
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors[colorScheme].background
          },
          headerTintColor: Colors[colorScheme].text,
        }}
      />
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Reset Your Password
        </ThemedText>

        {successMessage ? (
          <ThemedView style={styles.successContainer}>
            <ThemedText style={styles.successText}>{successMessage}</ThemedText>
            <Link href="/auth/login" asChild>
              <TouchableOpacity style={styles.button}>
                <ThemedText style={styles.buttonText}>Back to Login</ThemedText>
              </TouchableOpacity>
            </Link>
          </ThemedView>
        ) : (
          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.instructions}>
              Enter your email address and we'll send you a verification code to reset your password.
            </ThemedText>

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleForgotPassword}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.buttonText}>Send Verification Code</ThemedText>
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
