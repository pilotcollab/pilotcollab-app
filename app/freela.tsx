import DateTimePicker from '@react-native-community/datetimepicker'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

export default function Freela() {
  const router = useRouter()
  const { user } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  
  const [disponivel, setDisponivel] = useState(false)
  const [equipamentosSelecionados, setEquipamentosSelecionados] = useState<string[]>([])
  const [aeronaves, setAeronaves] = useState<any[]>([])
  const [observacoes, setObservacoes] = useState('')
  const [dataExpiracao, setDataExpiracao] = useState<Date | null>(null)
  const [dataTexto, setDataTexto] = useState('')
  const [temRegistro, setTemRegistro] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [user])

  async function carregarDados() {
    try {
      setLoading(true)
      
      const { data: aeroData } = await supabase
        .from('aeronaves_piloto')
        .select('*')
        .eq('usuario_id', user?.id)
      
      setAeronaves(aeroData || [])

      const { data: dispData } = await supabase
        .from('disponibilidade_freela')
        .select('*')
        .eq('usuario_id', user?.id)
        .maybeSingle()

      if (dispData) {
        setDisponivel(dispData.disponivel)
        setEquipamentosSelecionados(dispData.equipamentos || [])
        setObservacoes(dispData.observacoes || '')
        setTemRegistro(true)
        
        if (dispData.expira_em) {
          const expira = new Date(dispData.expira_em)
          setDataExpiracao(expira)
          setDataTexto(formatarData(expira))
        }
      } else {
        setDisponivel(false)
        setEquipamentosSelecionados([])
        setObservacoes('')
        setTemRegistro(false)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatarData(data: Date) {
    return data.toLocaleDateString('pt-BR')
  }

  function onDateChange(event: any, selectedDate?: Date) {
    if (Platform.OS === 'android') {
      setShowDatePicker(false)
    }
    
    if (selectedDate) {
      setDataExpiracao(selectedDate)
      setDataTexto(formatarData(selectedDate))
      
      if (Platform.OS === 'ios') {
        setShowDatePicker(false)
      }
    }
  }

  function sugerirData() {
    const data = new Date()
    data.setDate(data.getDate() + 7)
    setDataExpiracao(data)
    setDataTexto(formatarData(data))
  }

  function toggleEquipamento(icao: string) {
    setEquipamentosSelecionados(prev => {
      if (prev.includes(icao)) {
        return prev.filter(item => item !== icao)
      } else {
        return [...prev, icao]
      }
    })
  }

  function selecionarTodos() {
    if (equipamentosSelecionados.length === aeronaves.length) {
      setEquipamentosSelecionados([])
    } else {
      setEquipamentosSelecionados(aeronaves.map(av => av.tipo_icao))
    }
  }

  async function salvarDisponibilidade() {
    if (!user) return

    if (disponivel && equipamentosSelecionados.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos um equipamento disponível')
      return
    }

    if (disponivel && !dataExpiracao) {
      Alert.alert('Atenção', 'Selecione a data de expiração')
      return
    }

    setSalvando(true)
    try {
      if (disponivel) {
        const dados = {
          disponivel: true,
          equipamentos: equipamentosSelecionados,
          equipamento_principal: equipamentosSelecionados[0] || '',
          observacoes: observacoes,
          atualizado_em: new Date(),
          expira_em: dataExpiracao
        }

        if (temRegistro) {
          const { error } = await supabase
            .from('disponibilidade_freela')
            .update(dados)
            .eq('usuario_id', user.id)

          if (error) throw error
        } else {
          const { error } = await supabase
            .from('disponibilidade_freela')
            .insert({
              usuario_id: user.id,
              ...dados
            })

          if (error) throw error
        }
      } else {
        if (temRegistro) {
          const { error } = await supabase
            .from('disponibilidade_freela')
            .update({
              disponivel: false,
              atualizado_em: new Date()
            })
            .eq('usuario_id', user.id)

          if (error) throw error
        }
      }

      Alert.alert('✅ Sucesso', 'Disponibilidade atualizada!')
      router.back()
    } catch (error: any) {
      console.error('Erro detalhado:', error)
      Alert.alert('❌ Erro', error.message || 'Não foi possível salvar')
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.headerText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💼 Disponibilidade</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Disponível para Freela</Text>
            <Switch
              value={disponivel}
              onValueChange={setDisponivel}
              trackColor={{ false: '#ccc', true: '#4caf50' }}
              thumbColor={disponivel ? '#fff' : '#f4f3f4'}
            />
          </View>

          {disponivel && (
            <>
              <View style={styles.headerRow}>
                <Text style={styles.label}>Equipamentos Disponíveis</Text>
                {aeronaves.length > 0 && (
                  <TouchableOpacity onPress={selecionarTodos}>
                    <Text style={styles.selecionarTodosText}>
                      {equipamentosSelecionados.length === aeronaves.length ? 'Desmarcar todos' : 'Selecionar todos'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {aeronaves.length === 0 ? (
                <Text style={styles.emptyWarning}>
                  ⚠️ Você não tem aeronaves cadastradas. 
                  Adicione no seu perfil primeiro.
                </Text>
              ) : (
                <View style={styles.equipamentosContainer}>
                  {aeronaves.map(av => (
                    <TouchableOpacity
                      key={av.id}
                      style={[
                        styles.equipamentoButton,
                        equipamentosSelecionados.includes(av.tipo_icao) && styles.equipamentoButtonAtivo
                      ]}
                      onPress={() => toggleEquipamento(av.tipo_icao)}
                    >
                      <Text style={[
                        styles.equipamentoText,
                        equipamentosSelecionados.includes(av.tipo_icao) && styles.equipamentoTextAtivo
                      ]}>
                        {av.tipo_icao}
                      </Text>
                      {equipamentosSelecionados.includes(av.tipo_icao) && (
                        <Text style={styles.checkIcon}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.label}>Data de Expiração</Text>
              <TouchableOpacity
                style={styles.dataButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dataButtonText}>
                  {dataTexto || 'Selecionar data'}
                </Text>
                <Text style={styles.dataButtonIcon}>📅</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sugestaoDataButton} onPress={sugerirData}>
                <Text style={styles.sugestaoDataText}>
                  Sugerir: +7 dias ({new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString('pt-BR')})
                </Text>
              </TouchableOpacity>

              <Text style={styles.label}>Observações (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={observacoes}
                onChangeText={setObservacoes}
                placeholder="Ex: Disponível a partir de... Preferência por..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </>
          )}

          <TouchableOpacity
            style={[styles.saveButton, salvando && styles.disabled]}
            onPress={salvarDisponibilidade}
            disabled={salvando}
          >
            <Text style={styles.saveButtonText}>
              {salvando ? 'Salvando...' : 'Salvar Disponibilidade'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ Como funciona</Text>
          <Text style={styles.infoText}>
            • Marque como disponível quando estiver aceitando freelas{'\n'}
            • Selecione um ou mais equipamentos que pode voar{'\n'}
            • Escolha a data até quando quer ficar disponível{'\n'}
            • Após a data, sua disponibilidade expira automaticamente{'\n'}
            • Pilotos podem ver seu contato pelo WhatsApp
          </Text>
        </View>
      </ScrollView>

      {/* DatePicker para Android e iOS */}
      {showDatePicker && (
        <View style={Platform.OS === 'ios' ? styles.iosPickerContainer : undefined}>
          {Platform.OS === 'ios' && (
            <View style={styles.iosPickerHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.iosPickerCancel}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.iosPickerTitle}>Selecione a data</Text>
              <TouchableOpacity onPress={() => {
                // Fecha mantendo a data selecionada
                setShowDatePicker(false)
              }}>
                <Text style={styles.iosPickerDone}>OK</Text>
              </TouchableOpacity>
            </View>
          )}
          <DateTimePicker
            value={dataExpiracao || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            minimumDate={new Date()}
            style={Platform.OS === 'ios' ? styles.iosPicker : undefined}
            textColor={Platform.OS === 'ios' ? '#000000' : undefined} // Força texto preto no iOS
          />
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5'
  },
  centerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  header: {
    backgroundColor: '#0a7ea4',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  backButton: { 
    width: 40, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerText: { 
    fontSize: 20, 
    color: '#fff' 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  content: { 
    flex: 1 
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  switchLabel: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#333' 
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  label: { 
    fontSize: 12, 
    color: '#666', 
    marginBottom: 4, 
    fontWeight: '500' 
  },
  selecionarTodosText: {
    fontSize: 12,
    color: '#0a7ea4',
    fontWeight: '600'
  },
  equipamentosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },
  equipamentoButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  equipamentoButtonAtivo: {
    backgroundColor: '#e3f2fd',
    borderColor: '#0a7ea4'
  },
  equipamentoText: { 
    fontSize: 14, 
    color: '#333' 
  },
  equipamentoTextAtivo: { 
    color: '#0a7ea4', 
    fontWeight: 'bold' 
  },
  checkIcon: {
    fontSize: 12,
    color: '#0a7ea4',
    fontWeight: 'bold'
  },
  emptyWarning: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    textAlign: 'center'
  },
  dataButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#fafafa',
    marginBottom: 8
  },
  dataButtonText: { 
    fontSize: 14, 
    color: '#333' 
  },
  dataButtonIcon: { 
    fontSize: 16, 
    color: '#999' 
  },
  sugestaoDataButton: {
    marginBottom: 16,
    padding: 8,
    alignItems: 'center'
  },
  sugestaoDataText: {
    fontSize: 12,
    color: '#0a7ea4',
    textDecorationLine: 'underline'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    marginBottom: 16,
    backgroundColor: '#fafafa'
  },
  textArea: { 
    minHeight: 80 
  },
  saveButton: {
    backgroundColor: '#4caf50',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center'
  },
  saveButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  disabled: { 
    opacity: 0.5 
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16
  },
  infoTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#0a7ea4', 
    marginBottom: 8 
  },
  infoText: { 
    fontSize: 13, 
    color: '#333', 
    lineHeight: 20 
  },
  
  // Estilos para o DatePicker no iOS
  iosPickerContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  iosPickerCancel: {
    fontSize: 16,
    color: '#666',
  },
  iosPickerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  iosPickerDone: {
    fontSize: 16,
    color: '#0a7ea4',
    fontWeight: 'bold',
  },
  iosPicker: {
    height: 200,
    backgroundColor: '#fff',
  }
})