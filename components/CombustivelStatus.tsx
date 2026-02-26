import { useEffect, useState } from 'react'
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

type Fornecedor = {
  id: string
  nome: string
  icone: string
}

type CombustivelReport = {
  id: number
  icao: string
  avgas: { disponivel: boolean; fornecedores: string[] }[]
  jet: { disponivel: boolean; fornecedores: string[] }[]
  observacoes?: string
  reportado_por: string
  reportado_em: string
}

const FORNECEDORES_PREDEFINIDOS: Fornecedor[] = [
  { id: 'vibra', nome: 'Vibra', icone: '⚡' },
  { id: 'shell', nome: 'Shell', icone: '🐚' },
  { id: 'airbp', nome: 'AirBP', icone: '⛽' },
  { id: 'outro', nome: 'Outro', icone: '📌' },
]

export default function CombustivelStatus({ icao }: { icao: string }) {
  const { user } = useAuth()
  const [ultimoReport, setUltimoReport] = useState<CombustivelReport | null>(null)
  const [expandido, setExpandido] = useState(true)
  const [modalVisivel, setModalVisivel] = useState(false)
  
  // Estado do formulário
  const [avgasDisponivel, setAvgasDisponivel] = useState(true)
  const [avgasFornecedores, setAvgasFornecedores] = useState<string[]>([])
  const [avgasOutro, setAvgasOutro] = useState('')
  const [jetDisponivel, setJetDisponivel] = useState(true)
  const [jetFornecedores, setJetFornecedores] = useState<string[]>([])
  const [jetOutro, setJetOutro] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    carregarUltimoReport()
  }, [icao])

  async function carregarUltimoReport() {
    try {
      const { data, error } = await supabase
        .from('reports_combustivel')
        .select('*')
        .eq('icao', icao)
        .eq('status', 'ativo')
        .order('reportado_em', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }
      
      setUltimoReport(data || null)
    } catch (error) {
      console.error('Erro ao carregar report de combustível:', error)
    }
  }

  function toggleFornecedor(tipo: 'avgas' | 'jet', fornecedorId: string) {
    if (tipo === 'avgas') {
      if (avgasFornecedores.includes(fornecedorId)) {
        setAvgasFornecedores(avgasFornecedores.filter(f => f !== fornecedorId))
      } else {
        setAvgasFornecedores([...avgasFornecedores, fornecedorId])
      }
    } else {
      if (jetFornecedores.includes(fornecedorId)) {
        setJetFornecedores(jetFornecedores.filter(f => f !== fornecedorId))
      } else {
        setJetFornecedores([...jetFornecedores, fornecedorId])
      }
    }
  }

  function getFornecedorNome(fornecedorId: string) {
    const found = FORNECEDORES_PREDEFINIDOS.find(f => f.id === fornecedorId)
    return found ? `${found.icone} ${found.nome}` : fornecedorId
  }

  async function salvarReport() {
    if (!user) {
      Alert.alert('Login necessário', 'Faça login para reportar combustível')
      return
    }

    if (avgasFornecedores.length === 0 && jetFornecedores.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos um fornecedor')
      return
    }

    setEnviando(true)
    try {
      // Preparar os dados
      const avgasData = [{
        disponivel: avgasDisponivel,
        fornecedores: avgasFornecedores.includes('outro') && avgasOutro
          ? [...avgasFornecedores.filter(f => f !== 'outro'), `outro_${avgasOutro}`]
          : avgasFornecedores
      }]

      const jetData = [{
        disponivel: jetDisponivel,
        fornecedores: jetFornecedores.includes('outro') && jetOutro
          ? [...jetFornecedores.filter(f => f !== 'outro'), `outro_${jetOutro}`]
          : jetFornecedores
      }]

      const novoReport = {
        icao,
        avgas: avgasData,
        jet: jetData,
        observacoes,
        reportado_por: user.email,
        reportado_em: new Date().toISOString()
      }

      const { error } = await supabase
        .from('reports_combustivel')
        .insert([novoReport])

      if (error) throw error

      Alert.alert('Sucesso', 'Reporte de combustível enviado!')
      setModalVisivel(false)
      
      // Resetar formulário
      setAvgasDisponivel(true)
      setAvgasFornecedores([])
      setAvgasOutro('')
      setJetDisponivel(true)
      setJetFornecedores([])
      setJetOutro('')
      setObservacoes('')
      
      carregarUltimoReport()
    } catch (error: any) {
      Alert.alert('Erro', error.message)
    } finally {
      setEnviando(false)
    }
  }

  function formatarData(data: string) {
    const date = new Date(data)
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <TouchableOpacity 
        style={styles.header} 
        onPress={() => setExpandido(!expandido)}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>⛽</Text>
          <Text style={styles.title}>Combustível</Text>
        </View>
        <Text style={styles.expandButton}>{expandido ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {expandido && (
        <>
          {/* Último Reporte */}
          {!ultimoReport ? (
            <Text style={styles.emptyText}>Nenhum reporte de combustível</Text>
          ) : (
            <View style={styles.reportCard}>
              <Text style={styles.reportDate}>{formatarData(ultimoReport.reportado_em)}</Text>
              <Text style={styles.reportAuthor}>👤 {ultimoReport.reportado_por.split('@')[0]}</Text>
              
              {/* AVGAS e JET lado a lado com bolinhas */}
              <View style={styles.combustiveisRow}>
                {/* AVGAS */}
                <View style={styles.combustivelCard}>
                  <View style={styles.combustivelHeader}>
                    <Text style={styles.combustivelTipo}>⛽ AVGAS</Text>
                    <View style={[styles.bolinha, ultimoReport.avgas?.[0]?.disponivel ? styles.verde : styles.vermelho]} />
                  </View>
                  <View style={styles.fornecedoresTags}>
                    {ultimoReport.avgas?.[0]?.fornecedores.map((fornecedor, idx) => (
                      <Text key={idx} style={styles.fornecedorTag}>
                        {fornecedor.startsWith('outro_') 
                          ? `📌 ${fornecedor.replace('outro_', '')}` 
                          : getFornecedorNome(fornecedor)}
                      </Text>
                    ))}
                  </View>
                </View>

                {/* JET A1 */}
                <View style={styles.combustivelCard}>
                  <View style={styles.combustivelHeader}>
                    <Text style={styles.combustivelTipo}>🔥 JET A1</Text>
                    <View style={[styles.bolinha, ultimoReport.jet?.[0]?.disponivel ? styles.verde : styles.vermelho]} />
                  </View>
                  <View style={styles.fornecedoresTags}>
                    {ultimoReport.jet?.[0]?.fornecedores.map((fornecedor, idx) => (
                      <Text key={idx} style={styles.fornecedorTag}>
                        {fornecedor.startsWith('outro_') 
                          ? `📌 ${fornecedor.replace('outro_', '')}` 
                          : getFornecedorNome(fornecedor)}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>

              {ultimoReport.observacoes ? (
                <Text style={styles.observacoesText}>📝 {ultimoReport.observacoes}</Text>
              ) : null}
            </View>
          )}

          {/* Botão Adicionar */}
          {user && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setModalVisivel(true)}
            >
              <Text style={styles.addButtonText}>+ Reportar Combustível</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Modal de Reporte */}
      <Modal
        visible={modalVisivel}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⛽ Reportar Combustível</Text>
            
            <ScrollView style={styles.modalScroll}>
              
              {/* AVGAS */}
              <View style={styles.formSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>⛽ AVGAS</Text>
                  <TouchableOpacity
                    style={[styles.statusButton, avgasDisponivel ? styles.verde : styles.vermelho]}
                    onPress={() => setAvgasDisponivel(!avgasDisponivel)}
                  >
                    <Text style={styles.statusButtonText}>
                      {avgasDisponivel ? '✓ Disponível' : '✗ Indisponível'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Fornecedores (pode selecionar vários):</Text>
                <View style={styles.fornecedoresGrid}>
                  {FORNECEDORES_PREDEFINIDOS.map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      style={[
                        styles.fornecedorButton,
                        avgasFornecedores.includes(f.id) && styles.fornecedorButtonAtivo
                      ]}
                      onPress={() => toggleFornecedor('avgas', f.id)}
                    >
                      <Text style={styles.fornecedorButtonText}>
                        {f.icone} {f.nome}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {avgasFornecedores.includes('outro') && (
                  <TextInput
                    style={styles.input}
                    placeholder="Nome do fornecedor AVGAS"
                    value={avgasOutro}
                    onChangeText={setAvgasOutro}
                  />
                )}
              </View>

              {/* JET A1 */}
              <View style={styles.formSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>🔥 JET A1</Text>
                  <TouchableOpacity
                    style={[styles.statusButton, jetDisponivel ? styles.verde : styles.vermelho]}
                    onPress={() => setJetDisponivel(!jetDisponivel)}
                  >
                    <Text style={styles.statusButtonText}>
                      {jetDisponivel ? '✓ Disponível' : '✗ Indisponível'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Fornecedores (pode selecionar vários):</Text>
                <View style={styles.fornecedoresGrid}>
                  {FORNECEDORES_PREDEFINIDOS.map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      style={[
                        styles.fornecedorButton,
                        jetFornecedores.includes(f.id) && styles.fornecedorButtonAtivo
                      ]}
                      onPress={() => toggleFornecedor('jet', f.id)}
                    >
                      <Text style={styles.fornecedorButtonText}>
                        {f.icone} {f.nome}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {jetFornecedores.includes('outro') && (
                  <TextInput
                    style={styles.input}
                    placeholder="Nome do fornecedor JET A1"
                    value={jetOutro}
                    onChangeText={setJetOutro}
                  />
                )}
              </View>

              {/* Observações Gerais */}
              <View style={styles.formSection}>
                <Text style={styles.label}>Observações (opcional):</Text>
                <TextInput
                  style={[styles.input, styles.observacoesInput]}
                  placeholder="Ex: Pagamento em dinheiro, atendimento 24h..."
                  value={observacoes}
                  onChangeText={setObservacoes}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            {/* Botões do modal */}
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setModalVisivel(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.saveButton, enviando && styles.buttonDisabled]}
                onPress={salvarReport}
                disabled={enviando}
              >
                <Text style={styles.saveButtonText}>
                  {enviando ? 'Enviando...' : 'Salvar Reporte'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  reportCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8
  },
  reportDate: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4
  },
  reportAuthor: {
    fontSize: 11,
    color: '#0a7ea4',
    marginBottom: 8
  },
  // NOVOS ESTILOS PARA OS CARDS LADO A LADO
  combustiveisRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10
  },
  combustivelCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  combustivelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  combustivelTipo: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333'
  },
  bolinha: {
    width: 16,
    height: 16,
    borderRadius: 8
  },
  verde: {
    backgroundColor: '#4caf50'
  },
  vermelho: {
    backgroundColor: '#f44336'
  },
  fornecedoresTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4
  },
  fornecedorTag: {
    fontSize: 10,
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    color: '#0a7ea4'
  },
  observacoesText: {
    fontSize: 11,
    color: '#666',
    marginTop: 6,
    fontStyle: 'italic'
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
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '95%',
    maxHeight: '90%'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a7ea4',
    marginBottom: 15
  },
  modalScroll: {
    maxHeight: 500
  },
  formSection: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a7ea4'
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center'
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  label: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500'
  },
  fornecedoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  fornecedorButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  fornecedorButtonAtivo: {
    backgroundColor: '#e3f2fd',
    borderColor: '#0a7ea4'
  },
  fornecedorButtonText: {
    fontSize: 12,
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 13,
    marginBottom: 12,
    backgroundColor: '#fafafa'
  },
  observacoesInput: {
    minHeight: 80,
    textAlignVertical: 'top'
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
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
    borderRadius: 6,
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