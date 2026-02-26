import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

export default function AirportReport({ 
  icao, 
  onUpdate 
}: { 
  icao: string, 
  onUpdate?: () => void 
}) {
  const { user } = useAuth()
  const router = useRouter()
  const [expandido, setExpandido] = useState(false)
  const [condicao, setCondicao] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [loading, setLoading] = useState(false)

  async function saveReport() {
    if (!user) {
      Alert.alert('Login necessário', 'Faça login para reportar condições')
      return
    }

    if (!condicao.trim() && !observacoes.trim()) {
      Alert.alert('Atenção', 'Preencha pelo menos uma informação')
      return
    }

    setLoading(true)
    
    const novoReport = {
      icao,
      pista_condicao: condicao,
      observacoes: observacoes,
      reportado_por: user.email,
      reportado_em: new Date().toISOString()
    }

    try {
      const { error } = await supabase
        .from('reports') // Tabela original para condições de pista
        .insert([novoReport])

      if (error) {
        Alert.alert('Erro', error.message)
      } else {
        setCondicao('')
        setObservacoes('')
        setExpandido(false)
        Alert.alert('Sucesso', 'Reporte enviado! Obrigado por contribuir.')
        if (onUpdate) onUpdate()
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header} 
        onPress={() => {
          if (!user) {
            router.push('/login')
          } else {
            setExpandido(!expandido)
          }
        }}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>✈️</Text>
          <Text style={styles.title}>Reportar Condições da Pista</Text>
        </View>
        {!user ? (
          <View style={styles.loginBadge}>
            <Text style={styles.loginBadgeText}>🔑 Login</Text>
          </View>
        ) : (
          <Text style={styles.expandButton}>{expandido ? '▼' : '▶'}</Text>
        )}
      </TouchableOpacity>

      {!user ? (
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>
            Faça login para reportar condições da pista e observações
          </Text>
        </View>
      ) : (
        expandido && (
          <View style={styles.reportEdit}>
            <TextInput
              style={styles.input}
              placeholder="Condição da pista (ex: molhada, obras)"
              placeholderTextColor="#999"
              value={condicao}
              onChangeText={setCondicao}
            />
            
            <TextInput
              style={[styles.input, styles.observacoesInput]}
              placeholder="Observações adicionais"
              placeholderTextColor="#999"
              value={observacoes}
              onChangeText={setObservacoes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setExpandido(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.saveButton, loading && styles.buttonDisabled]} 
                onPress={saveReport}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Enviando...' : 'Enviar Reporte'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerIcon: {
    fontSize: 18
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a7ea4'
  },
  expandButton: {
    fontSize: 18,
    color: '#0a7ea4',
    fontWeight: 'bold'
  },
  loginBadge: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16
  },
  loginBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold'
  },
  loginPrompt: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff3e0'
  },
  loginPromptText: {
    fontSize: 14,
    color: '#e65100',
    textAlign: 'center'
  },
  reportEdit: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fafafa'
  },
  observacoesInput: {
    minHeight: 80,
    textAlignVertical: 'top'
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#4caf50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500'
  },
  buttonDisabled: {
    opacity: 0.5
  }
})