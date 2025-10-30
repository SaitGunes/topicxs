import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'verify' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async () => {
    if (!email.trim() || !username.trim()) {
      Alert.alert('Error', 'Please enter both email and username');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email: email.trim(),
        username: username.trim(),
      });

      setGeneratedCode(response.data.reset_code);
      setStep('verify');
      Alert.alert('Success', `Your reset code is: ${response.data.reset_code}\n\nPlease enter this code in the next step.`);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'User not found');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = () => {
    if (!resetCode.trim()) {
      Alert.alert('Error', 'Please enter the reset code');
      return;
    }

    if (resetCode.toUpperCase() !== generatedCode) {
      Alert.alert('Error', 'Invalid reset code');
      return;
    }

    setStep('reset');
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, {
        email: email.trim(),
        reset_code: resetCode.toUpperCase(),
        new_password: newPassword,
      });

      Alert.alert('Success', 'Password has been reset!', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            {step === 'email' && 'Enter your account details'}
            {step === 'verify' && 'Enter the reset code'}
            {step === 'reset' && 'Create a new password'}
          </Text>
        </View>

        <View style={styles.form}>
          {/* Step 1: Email & Username */}
          {step === 'email' && (
            <>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
              </View>

              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRequestReset}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Checking...' : 'Get Reset Code'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Step 2: Verify Code */}
          {step === 'verify' && (
            <>
              <View style={styles.codeDisplay}>
                <Text style={styles.codeLabel}>Your Reset Code:</Text>
                <Text style={styles.codeText}>{generatedCode}</Text>
                <Text style={styles.codeHint}>Enter this code below</Text>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="key-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter Reset Code"
                  value={resetCode}
                  onChangeText={setResetCode}
                  autoCapitalize="characters"
                  placeholderTextColor="#999"
                />
              </View>

              <TouchableOpacity 
                style={styles.button}
                onPress={handleVerifyCode}
              >
                <Text style={styles.buttonText}>Verify Code</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Step 3: New Password */}
          {step === 'reset' && (
            <>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="New Password (min. 6 characters)"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholderTextColor="#999"
                />
              </View>

              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => router.back()}
          >
            <Text style={styles.linkText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 48,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#000',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
  codeDisplay: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  codeLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  codeText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 4,
    marginBottom: 8,
  },
  codeHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
});
