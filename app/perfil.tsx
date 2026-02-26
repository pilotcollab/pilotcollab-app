import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

const AERONAVES_SUGESTAO = [
  { icao: 'B733', nome: 'Boeing 737-300' },
  { icao: 'B734', nome: 'Boeing 737-400' },
  { icao: 'B735', nome: 'Boeing 737-500' },
  { icao: 'B736', nome: 'Boeing 737-600' },
  { icao: 'B737', nome: 'Boeing 737-700' },
  { icao: 'B738', nome: 'Boeing 737-800' },
  { icao: 'B739', nome: 'Boeing 737-900' },
  { icao: 'A319', nome: 'Airbus A319' },
  { icao: 'A320', nome: 'Airbus A320' },
  { icao: 'A321', nome: 'Airbus A321' },
  { icao: 'E190', nome: 'Embraer 190' },
  { icao: 'E195', nome: 'Embraer 195' },
  { icao: 'E50P', nome: 'Embraer Phenom 100' },
  { icao: 'E55P', nome: 'Embraer Phenom 300' },
  { icao: 'C208', nome: 'Cessna 208 Caravan' },
  { icao: 'PC12', nome: 'Pilatus PC-12' },
  { icao: 'AT72', nome: 'ATR 72' },
]

export default function Perfil() {
  const router = useRouter()
  const { user } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [showBaseModal, setShowBaseModal] = useState(false)
  
  // Dados do perfil
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [base, setBase] = useState('SP')
  const [pic, setPic] = useState(false)
  const [sic, setSic] = useState(false)
  
  // Aeronaves
  const [aeronaves, setAeronaves] = useState<any[]>([])
  const [novaAeronave, setNovaAeronave] = useState('')
  const [showAeronaves, setShowAeronaves] = useState(false)

  useEffect(() => {
    if (user) {
      carregarPerfil()
      carregarAeronaves()
    }
  }, [user])

  async function carregarPerfil() {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setNomeCompleto(data.nome_completo || '')
        setWhatsapp(data.whatsapp || '')
        setBase(data.uf || 'SP')
        setPic(data.pic || false)
        setSic(data.sic || false)
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  async function carregarAeronaves() {
    const { data } = await supabase
      .from('aeronaves_piloto')
      .select('*')
      .eq('usuario_id', user?.id)
    
    setAeronaves(data || [])
  }

  async function salvarPerfil() {
    if (!user) return

    setSalvando(true)
    try {
      const { error } = await supabase
        .from('perfis')
        .upsert({
          id: user.id,
          nome_completo: nomeCompleto,
          whatsapp: whatsapp,
          uf: base,
          pic: pic,
          sic: sic,
          updated_at: new Date()
        })

      if (error) throw error

      Alert.alert('✅ Sucesso', 'Perfil atualizado!')
    } catch (error: any) {
      Alert.alert('❌ Erro', error.message)
    } finally {
      setSalvando(false)
    }
  }

  async function adicionarAeronave() {
    if (!novaAeronave.trim() || novaAeronave.length !== 4) {
      Alert.alert('Atenção', 'Digite um código ICAO válido (4 letras)')
      return
    }

    const icao = novaAeronave.toUpperCase()

    if (aeronaves.some(a => a.tipo_icao === icao)) {
      Alert.alert('Atenção', 'Esta aeronave já foi adicionada')
      return
    }

    try {
      const { error } = await supabase
        .from('aeronaves_piloto')
        .insert({
          usuario_id: user?.id,
          tipo_icao: icao,
          descricao: AERONAVES_SUGESTAO.find(a => a.icao === icao)?.nome || icao
        })

      if (error) throw error

      setNovaAeronave('')
      carregarAeronaves()
    } catch (error: any) {
      Alert.alert('❌ Erro', error.message)
    }
  }

  async function removerAeronave(id: number) {
    Alert.alert(
      'Remover Aeronave',
      'Deseja remover esta aeronave da sua lista?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('aeronaves_piloto').delete().eq('id', id)
            carregarAeronaves()
          }
        }
      ]
    )
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
        <Text style={styles.headerTitle}>👤 Meu Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card do Email */}
          <View style={styles.emailCard}>
            <Text style={styles.emailLabel}>📧 Email</Text>
            <Text style={styles.emailValue}>{user?.email}</Text>
          </View>

          {/* Dados Pessoais */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📋 Dados Pessoais</Text>
            
            <Text style={styles.label}>Nome Completo</Text>
            <TextInput
              style={styles.input}
              value={nomeCompleto}
              onChangeText={setNomeCompleto}
              placeholder="Seu nome completo"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>WhatsApp (com DDD)</Text>
            <TextInput
              style={styles.input}
              value={whatsapp}
              onChangeText={setWhatsapp}
              placeholder="11999999999"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Base (UF)</Text>
            <TouchableOpacity
              style={styles.baseButton}
              onPress={() => setShowBaseModal(true)}
            >
              <Text style={styles.baseButtonText}>{base}</Text>
              <Text style={styles.baseButtonIcon}>▼</Text>
            </TouchableOpacity>

            {/* PIC/SIC */}
            <Text style={styles.label}>Função</Text>
            <View style={styles.funcaoContainer}>
              <TouchableOpacity
                style={[styles.funcaoButton, pic && styles.funcaoButtonAtivo]}
                onPress={() => setPic(!pic)}
              >
                <Text style={[styles.funcaoButtonText, pic && styles.funcaoButtonTextAtivo]}>
                  PIC
                </Text>
                <Text style={styles.funcaoDesc}>Pilot in Command</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.funcaoButton, sic && styles.funcaoButtonAtivo]}
                onPress={() => setSic(!sic)}
              >
                <Text style={[styles.funcaoButtonText, sic && styles.funcaoButtonTextAtivo]}>
                  SIC
                </Text>
                <Text style={styles.funcaoDesc}>Second in Command</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, salvando && styles.disabled]}
              onPress={salvarPerfil}
              disabled={salvando}
            >
              <Text style={styles.saveButtonText}>
                {salvando ? 'Salvando...' : 'Salvar Perfil'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Aeronaves que Voa */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>✈️ Aeronaves que Voa</Text>
            
            {aeronaves.map(av => (
              <View key={av.id} style={styles.aeronaveItem}>
                <View>
                  <Text style={styles.aeronaveIcao}>{av.tipo_icao}</Text>
                  <Text style={styles.aeronaveDesc}>{av.descricao}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => removerAeronave(av.id)}
                  style={styles.removeAeronave}
                >
                  <Text style={styles.removeAeronaveText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addAeronave}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                value={novaAeronave}
                onChangeText={setNovaAeronave}
                placeholder="Código ICAO (ex: B733)"
                placeholderTextColor="#999"
                maxLength={4}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={adicionarAeronave}
              >
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.sugestoesButton}
              onPress={() => setShowAeronaves(!showAeronaves)}
            >
              <Text style={styles.sugestoesButtonText}>
                {showAeronaves ? '▲ Ocultar sugestões' : '▼ Ver sugestões de códigos'}
              </Text>
            </TouchableOpacity>

            {showAeronaves && (
              <View style={styles.sugestoesContainer}>
                {AERONAVES_SUGESTAO.map(item => (
                  <TouchableOpacity
                    key={item.icao}
                    style={styles.sugestaoItem}
                    onPress={() => setNovaAeronave(item.icao)}
                  >
                    <Text style={styles.sugestaoIcao}>{item.icao}</Text>
                    <Text style={styles.sugestaoNome}> - {item.nome}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Botão para Freela */}
          <TouchableOpacity
            style={styles.freelaButton}
            onPress={() => router.push('/freela' as any)}
          >
            <Text style={styles.freelaButtonIcon}>💼</Text>
            <View style={styles.freelaButtonText}>
              <Text style={styles.freelaButtonTitle}>Disponibilidade para Freela</Text>
              <Text style={styles.freelaButtonSubtitle}>
                Marque quando estiver disponível para voos
              </Text>
            </View>
            <Text style={styles.freelaButtonArrow}>→</Text>
          </TouchableOpacity>
          
          <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal para selecionar Base (UF) */}
      <Modal
        visible={showBaseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBaseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione sua Base</Text>
              <TouchableOpacity onPress={() => setShowBaseModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalList}>
              {UFS.map(uf => (
                <TouchableOpacity
                  key={uf}
                  style={[
                    styles.modalItem,
                    base === uf && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setBase(uf)
                    setShowBaseModal(false)
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    base === uf && styles.modalItemTextSelected
                  ]}>
                    {uf}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  keyboardView: { flex: 1 },
  header: {
    backgroundColor: '#0a7ea4',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerText: { fontSize: 20, color: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  content: { flex: 1, padding: 16 },
  
  // Card de Email
  emailCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#0a7ea4'
  },
  emailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500'
  },
  emailValue: {
    fontSize: 16,
    color: '#0a7ea4',
    fontWeight: '600'
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
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#0a7ea4', marginBottom: 16 },
  label: { fontSize: 12, color: '#666', marginBottom: 4, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
    backgroundColor: '#fafafa'
  },
  
  // Botão de Base
  baseButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#fafafa',
    marginBottom: 12
  },
  baseButtonText: { fontSize: 14, color: '#333' },
  baseButtonIcon: { fontSize: 14, color: '#999' },
  
  // Estilos para PIC/SIC
  funcaoContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  funcaoButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center'
  },
  funcaoButtonAtivo: {
    backgroundColor: '#e3f2fd',
    borderColor: '#0a7ea4'
  },
  funcaoButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2
  },
  funcaoButtonTextAtivo: {
    color: '#0a7ea4'
  },
  funcaoDesc: {
    fontSize: 10,
    color: '#666'
  },
  
  saveButton: {
    backgroundColor: '#4caf50',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8
  },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  disabled: { opacity: 0.5 },
  
  aeronaveItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8
  },
  aeronaveIcao: { fontSize: 15, fontWeight: 'bold', color: '#0a7ea4' },
  aeronaveDesc: { fontSize: 12, color: '#666' },
  removeAeronave: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center'
  },
  removeAeronaveText: { fontSize: 14, color: '#c62828', fontWeight: 'bold' },
  addAeronave: { flexDirection: 'row', marginTop: 8 },
  addButton: {
    width: 44,
    backgroundColor: '#0a7ea4',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  addButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  sugestoesButton: { marginTop: 12, padding: 8, alignItems: 'center' },
  sugestoesButtonText: { color: '#0a7ea4', fontSize: 13 },
  sugestoesContainer: { marginTop: 8, gap: 6 },
  sugestaoItem: { flexDirection: 'row', padding: 6 },
  sugestaoIcao: { fontWeight: 'bold', color: '#333' },
  sugestaoNome: { color: '#666' },
  
  freelaButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 30
  },
  freelaButtonIcon: { fontSize: 24, marginRight: 12 },
  freelaButtonText: { flex: 1 },
  freelaButtonTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  freelaButtonSubtitle: { fontSize: 12, color: '#999' },
  freelaButtonArrow: { fontSize: 20, color: '#0a7ea4', fontWeight: 'bold' },
  bottomSpace: { height: 20 },
  
  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  modalClose: {
    fontSize: 20,
    color: '#999',
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalItemTextSelected: {
    color: '#0a7ea4',
    fontWeight: 'bold',
  },
})