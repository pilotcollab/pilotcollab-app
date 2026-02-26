import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [modo, setModo] = useState<'login' | 'cadastro'>('login')
  const [termoAceito, setTermoAceito] = useState(false)
  const router = useRouter()

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert('Atenção', 'Preencha email e senha')
      return
    }

    if (password.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres')
      return
    }

    // Verificar aceite do termo no cadastro
    if (modo === 'cadastro' && !termoAceito) {
      Alert.alert('Atenção', 'Você precisa aceitar o Termo de Uso para se cadastrar')
      return
    }

    setLoading(true)

    try {
      if (modo === 'cadastro') {
        // CADASTRO
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
        })

        if (error) {
          if (error.message.includes('already registered')) {
            Alert.alert('Email já cadastrado', 'Este email já possui uma conta. Faça login.')
            setModo('login')
          } else {
            Alert.alert('Erro no cadastro', error.message)
          }
        } else {
          Alert.alert(
            'Cadastro realizado!', 
            'Verifique seu email para confirmar a conta antes de fazer login.',
            [{ text: 'OK', onPress: () => setModo('login') }]
          )
        }
      } else {
        // LOGIN
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        })

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            Alert.alert(
              'Erro de login', 
              'Email ou senha incorretos. Se não tem conta, escolha "Criar Conta".'
            )
          } else if (error.message.includes('Email not confirmed')) {
            Alert.alert(
              'Email não confirmado', 
              'Verifique sua caixa de entrada e confirme o email antes de fazer login.'
            )
          } else {
            Alert.alert('Erro no login', error.message)
          }
        } else {
          Alert.alert('Sucesso!', 'Login realizado com sucesso.', [
            { text: 'OK', onPress: () => router.back() }
          ])
        }
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message)
    } finally {
      setLoading(false)
    }
  }

  function abrirTermoDeUso() {
    router.push('/termo-de-uso')
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Pilot Collab</Text>
          <Text style={styles.subtitle}>
            {modo === 'login' ? 'Faça login para reportar' : 'Crie sua conta'}
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="Seu email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Senha (mínimo 6 caracteres)"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* TERMO DE USO - SÓ APARECE NO CADASTRO */}
          {modo === 'cadastro' && (
            <View style={styles.termoContainer}>
              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => setTermoAceito(!termoAceito)}
              >
                <View style={[styles.checkbox, termoAceito && styles.checkboxChecked]}>
                  {termoAceito && <Text style={styles.checkboxIcon}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>
                  Eu li e aceito o
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={abrirTermoDeUso}>
                <Text style={styles.termoLink}>Termo de Uso e Responsabilidade</Text>
              </TouchableOpacity>

              {/* Resumo do termo */}
              <View style={styles.termoResumo}>
                <Text style={styles.termoResumoText}>
                  ⚠️ Este é um app colaborativo. As informações NÃO substituem fontes oficiais. 
                  O piloto é o único responsável pela segurança do voo.
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {modo === 'login' ? 'Entrar' : 'Criar Conta'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.switchButton}
            onPress={() => {
              setModo(modo === 'login' ? 'cadastro' : 'login')
              setTermoAceito(false) // Reset do termo ao mudar
            }}
            disabled={loading}
          >
            <Text style={styles.switchButtonText}>
              {modo === 'login' 
                ? 'Não tem conta? Criar conta' 
                : 'Já tem conta? Fazer login'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 20 
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#0a7ea4', 
    textAlign: 'center', 
    marginBottom: 10 
  },
  subtitle: { 
    fontSize: 16, 
    color: '#666', 
    textAlign: 'center', 
    marginBottom: 40 
  },
  input: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16
  },
  button: { 
    backgroundColor: '#0a7ea4', 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginBottom: 15,
    minHeight: 50,
    justifyContent: 'center'
  },
  buttonDisabled: { 
    opacity: 0.5 
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  switchButton: {
    padding: 15,
    alignItems: 'center'
  },
  switchButtonText: {
    color: '#0a7ea4',
    fontSize: 14,
    fontWeight: '500'
  },
  backButton: {
    padding: 15,
    alignItems: 'center'
  },
  backButtonText: {
    color: '#999',
    fontSize: 14
  },
  // Estilos do Termo de Uso
  termoContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b8e0ff'
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#0a7ea4',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxChecked: {
    backgroundColor: '#0a7ea4'
  },
  checkboxIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333'
  },
  termoLink: {
    fontSize: 14,
    color: '#0a7ea4',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    marginBottom: 10
  },
  termoResumo: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#ff9800'
  },
  termoResumoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18
  }
})