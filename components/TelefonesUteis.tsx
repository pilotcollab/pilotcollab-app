import { FontAwesome } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

type Telefone = {
  id: number
  icao: string
  tipo: string
  nome_contato?: string
  descricao?: string
  telefone: string
  reportado_por: string
  reportado_em: string
  denuncias?: number
  denunciado_por?: string[]
  status?: string
}

const TIPOS_PREDEFINIDOS = [
  { id: 'abastecimento', nome: 'Abastecimento', icone: '⛽' },
  { id: 'operador', nome: 'Operador', icone: '👨‍✈️' },
  { id: 'info', nome: 'Informações', icone: 'ℹ️' },
  { id: 'emergencia', nome: 'Emergência', icone: '🚨' },
  { id: 'taxi', nome: 'Táxi Aéreo', icone: '🚕' },
  { id: 'hangar', nome: 'Hangar', icone: '🏢' },
  { id: 'manutencao', nome: 'Manutenção', icone: '🔧' },
  { id: 'outro', nome: 'Outro', icone: '📞' },
]

export default function TelefonesUteis({ icao }: { icao: string }) {
  const { user } = useAuth()
  const [telefones, setTelefones] = useState<Telefone[]>([])
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState(true)
  const [modalVisivel, setModalVisivel] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [tipoSelecionado, setTipoSelecionado] = useState('abastecimento')
  const [nomeContato, setNomeContato] = useState('')
  const [descricao, setDescricao] = useState('')
  const [telefone, setTelefone] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    carregarTelefones()
    verificarAdmin()
  }, [icao])

  async function verificarAdmin() {
    if (!user) return
    try {
      const { data } = await supabase
        .from('admins')
        .select('*')
        .eq('email', user.email)
        .maybeSingle()
      setIsAdmin(!!data)
    } catch (error) {
      setIsAdmin(false)
    }
  }

  async function carregarTelefones() {
    try {
      const { data, error } = await supabase
        .from('telefones_uteis')
        .select('*')
        .eq('icao', icao)
        .eq('status', 'ativo')
        .order('tipo')
        .order('reportado_em', { ascending: false })

      if (error) throw error
      setTelefones(data || [])
    } catch (error) {
      console.error('Erro ao carregar telefones:', error)
    } finally {
      setLoading(false)
    }
  }

  async function apagarTelefone(id: number, autor: string) {
    const podeApagar = isAdmin || user?.email === autor
    
    if (!podeApagar) {
      Alert.alert('Acesso negado', 'Você não pode apagar este telefone')
      return
    }

    Alert.alert(
      'Confirmar exclusão',
      isAdmin ? `Remover telefone de ${autor.split('@')[0]}?` : 'Remover seu telefone?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isAdmin) {
                const { error } = await supabase
                  .from('telefones_uteis')
                  .update({ status: 'removido' })
                  .eq('id', id)
                if (error) throw error
                Alert.alert('Sucesso', 'Telefone removido pela moderação')
              } else {
                const { error } = await supabase
                  .from('telefones_uteis')
                  .delete()
                  .eq('id', id)
                if (error) throw error
                Alert.alert('Sucesso', 'Seu telefone foi apagado')
              }
              carregarTelefones()
            } catch (error: any) {
              Alert.alert('Erro', error.message)
            }
          }
        }
      ]
    )
  }

  function fazerLigacao(numero: string) {
    Linking.openURL(`tel:${numero}`)
  }

  function abrirWhatsApp(numero: string) {
    // Remove caracteres não numéricos
    const numeroLimpo = numero.replace(/\D/g, '')
    
    // Formato internacional (assumindo Brasil)
    const numeroWhatsApp = `55${numeroLimpo}`
    
    const url = `whatsapp://send?phone=${numeroWhatsApp}`
    
    Linking.openURL(url).catch(() => {
      // Se WhatsApp não estiver instalado, tenta o link web
      Linking.openURL(`https://wa.me/${numeroWhatsApp}`).catch(() => {
        Alert.alert('Erro', 'Não foi possível abrir o WhatsApp')
      })
    })
  }

  async function adicionarTelefone() {
    if (!user) {
      Alert.alert('Login necessário', 'Faça login para adicionar telefones')
      return
    }

    if (!telefone.trim()) {
      Alert.alert('Atenção', 'Digite um número de telefone')
      return
    }

    setEnviando(true)
    try {
      const tipoSelecionadoObj = TIPOS_PREDEFINIDOS.find(t => t.id === tipoSelecionado)
      
      const novoTelefone = {
        icao,
        tipo: tipoSelecionado,
        nome_contato: nomeContato.trim() || tipoSelecionadoObj?.nome,
        descricao: tipoSelecionado === 'outro' ? descricao : null,
        telefone: telefone.trim(),
        reportado_por: user.email,
        reportado_em: new Date().toISOString()
      }

      const { error } = await supabase
        .from('telefones_uteis')
        .insert([novoTelefone])

      if (error) throw error

      // Limpar campos
      setTelefone('')
      setNomeContato('')
      setDescricao('')
      setTipoSelecionado('abastecimento')
      setModalVisivel(false)
      carregarTelefones()
    } catch (error: any) {
      Alert.alert('Erro', error.message)
    } finally {
      setEnviando(false)
    }
  }

  function getIcone(tipo: string) {
    const encontrado = TIPOS_PREDEFINIDOS.find(t => t.id === tipo)
    return encontrado?.icone || '📞'
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando telefones...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <TouchableOpacity 
        style={styles.header} 
        onPress={() => setExpandido(!expandido)}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>📞</Text>
          <Text style={styles.title}>Telefones Úteis ({telefones.length})</Text>
        </View>
        <Text style={styles.expandButton}>{expandido ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {expandido && (
        <>
          {/* Lista de Telefones */}
          {telefones.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum telefone cadastrado</Text>
          ) : (
            <FlatList
              data={telefones}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const podeApagar = isAdmin || user?.email === item.reportado_por
                
                return (
                  <View style={styles.phoneItemWrapper}>
                    {/* Área principal - toque para ligar */}
                    <TouchableOpacity 
                      style={styles.phoneItem}
                      onPress={() => fazerLigacao(item.telefone)}
                    >
                      <View style={styles.phoneHeader}>
                        <Text style={styles.phoneIcon}>{getIcone(item.tipo)}</Text>
                        <View style={styles.phoneInfo}>
                          <Text style={styles.phoneNome}>
                            {item.nome_contato || item.tipo}
                          </Text>
                          <Text style={styles.phoneNumero}>{item.telefone}</Text>
                          {item.descricao && (
                            <Text style={styles.phoneDescricao}>{item.descricao}</Text>
                          )}
                        </View>
                      </View>
                      <Text style={styles.phoneMeta}>
                        {item.reportado_por?.split('@')[0]}
                        {item.reportado_por === user?.email ? ' • (seu)' : ''}
                      </Text>
                    </TouchableOpacity>

                    {/* Botões de ação à direita */}
                    <View style={styles.actionButtons}>
                      {/* Botão do WhatsApp com ícone do FontAwesome */}
                      <TouchableOpacity
                        style={styles.whatsappButton}
                        onPress={() => abrirWhatsApp(item.telefone)}
                      >
                        <FontAwesome name="whatsapp" size={20} color="#fff" />
                      </TouchableOpacity>

                      {/* Botão de apagar (se tiver permissão) */}
                      {user && podeApagar && (
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => apagarTelefone(item.id, item.reportado_por)}
                        >
                          <Text style={styles.deleteButtonText}>🗑️</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )
              }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}

          {/* Botão Adicionar */}
          {user && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setModalVisivel(true)}
            >
              <Text style={styles.addButtonText}>+ Adicionar Telefone</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Modal de Adicionar */}
      <Modal
        visible={modalVisivel}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisivel(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.modalKeyboardView}
            >
              <View style={styles.modalContent}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalTitle}>📞 Adicionar Telefone</Text>

                  {/* Tipo */}
                  <Text style={styles.label}>Tipo:</Text>
                  <View style={styles.tiposGrid}>
                    {TIPOS_PREDEFINIDOS.map((tipo) => (
                      <TouchableOpacity
                        key={tipo.id}
                        style={[
                          styles.tipoButton,
                          tipoSelecionado === tipo.id && styles.tipoButtonAtivo
                        ]}
                        onPress={() => setTipoSelecionado(tipo.id)}
                      >
                        <Text style={styles.tipoButtonText}>
                          {tipo.icone} {tipo.nome}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Nome do Contato */}
                  <Text style={styles.label}>Nome do contato (opcional):</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Torre, Rádio, Chefia..."
                    value={nomeContato}
                    onChangeText={setNomeContato}
                  />

                  {/* Descrição (para tipo 'outro') */}
                  {tipoSelecionado === 'outro' && (
                    <>
                      <Text style={styles.label}>Descrição:</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ex: Restaurante, Táxi..."
                        value={descricao}
                        onChangeText={setDescricao}
                      />
                    </>
                  )}

                  {/* Telefone */}
                  <Text style={styles.label}>Telefone:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="(11) 1234-5678"
                    value={telefone}
                    onChangeText={setTelefone}
                    keyboardType="phone-pad"
                  />

                  {/* Botões */}
                  <View style={styles.modalButtons}>
                    <TouchableOpacity 
                      style={styles.cancelButton}
                      onPress={() => setModalVisivel(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.saveButton, enviando && styles.buttonDisabled]} 
                      onPress={adicionarTelefone}
                      disabled={enviando}
                    >
                      <Text style={styles.saveButtonText}>
                        {enviando ? 'Adicionando...' : 'Adicionar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
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
  emptyText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 20
  },
  phoneItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  phoneItem: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6
  },
  phoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4
  },
  phoneIcon: {
    fontSize: 20,
    width: 30
  },
  phoneInfo: {
    flex: 1
  },
  phoneNome: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2
  },
  phoneNumero: {
    fontSize: 14,
    color: '#0a7ea4',
    fontWeight: '500',
    marginBottom: 2
  },
  phoneDescricao: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic'
  },
  phoneMeta: {
    fontSize: 10,
    color: '#999',
    marginTop: 2
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 6
  },
  whatsappButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center'
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center'
  },
  deleteButtonText: {
    fontSize: 16
  },
  separator: {
    height: 6
  },
  addButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    alignItems: 'center'
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalKeyboardView: {
    width: '100%',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a7ea4',
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500'
  },
  tiposGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15
  },
  tipoButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  tipoButtonAtivo: {
    backgroundColor: '#e3f2fd',
    borderColor: '#0a7ea4'
  },
  tipoButtonText: {
    fontSize: 12,
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 15,
    backgroundColor: '#fafafa'
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10
  },
  cancelButton: {
    flex: 1,
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
  saveButton: {
    flex: 1,
    backgroundColor: '#0a7ea4',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  buttonDisabled: {
    opacity: 0.5
  }
})