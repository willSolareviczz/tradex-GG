import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { supabase } from '../../lib/supabase'

type Step = 'telefone' | 'otp'

export default function LoginEntregador() {
  const [step, setStep] = useState<Step>('telefone')
  const [telefone, setTelefone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  async function enviarOTP() {
    if (!telefone.match(/^\+55\d{10,11}$/)) {
      Alert.alert('Telefone inválido', 'Use o formato +5511999999999')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ phone: telefone })
    setLoading(false)

    if (error) {
      Alert.alert('Erro', error.message)
      return
    }

    setStep('otp')
  }

  async function verificarOTP() {
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      phone: telefone,
      token: otp,
      type: 'sms',
    })
    setLoading(false)

    if (error) {
      Alert.alert('Código inválido', 'Verifique o código e tente novamente.')
    }
    // On success: _layout.tsx detects session and redirects to /(tabs)/
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Rotadesk</Text>
        <Text style={styles.subtitle}>
          {step === 'telefone' ? 'Entre com seu telefone' : 'Digite o código recebido'}
        </Text>

        {step === 'telefone' ? (
          <>
            <TextInput
              style={styles.input}
              value={telefone}
              onChangeText={setTelefone}
              placeholder="+5511999999999"
              keyboardType="phone-pad"
              autoComplete="tel"
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={enviarOTP}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Enviando...' : 'Receber código'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.hint}>Código enviado para {telefone}</Text>
            <TextInput
              style={styles.input}
              value={otp}
              onChangeText={setOtp}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={verificarOTP}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Verificando...' : 'Entrar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('telefone')}>
              <Text style={styles.link}>Trocar número</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 24, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  title: { fontSize: 24, fontWeight: '700', color: '#1e40af', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#6b7280', marginBottom: 24 },
  hint: { fontSize: 13, color: '#6b7280', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
  button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#93c5fd' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  link: { textAlign: 'center', color: '#2563eb', marginTop: 16, fontSize: 14 },
})
