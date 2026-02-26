import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

type ReporteDenunciado = {
  id: number
  icao: string
  pista_condicao: string
  observacoes?: string
  reportado_por: string
  reportado_em: string
  denuncias: number
  denunciado_por?: string[]
}

export default function Moderacao() {
  const router = useRouter()
  const { user } = useAuth()
  const [atualizando, setAtualizando] = useState(false)
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string | null>(null)
  const [reportsDenunciados, setReportsDenunciados] = useState<ReporteDenunciado[]>([])
  const [telefonesDenunciados, setTelefonesDenunciados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estado para o modal de detalhes
  const [modalVisible, setModalVisible] = useState(false)
  const [reporteSelecionado, setReporteSelecionado] = useState<ReporteDenunciado | null>(null)

  useEffect(() => {
    carregarDenuncias()
    carregarUltimaAtualizacao()
  }, [])

  async function carregarDenuncias() {
    try {
      const [reports, telefones] = await Promise.all([
        supabase.from('reports').select('*').gte('denuncias', 1).eq('status', 'ativo'),
        supabase.from('telefones_uteis').select('*').gte('denuncias', 1).eq('status', 'ativo')
      ])
      
      setReportsDenunciados(reports.data || [])
      setTelefonesDenunciados(telefones.data || [])
    } catch (error) {
      console.error('Erro ao carregar denúncias:', error)
    } finally {
      setLoading(false)
    }
  }

  async function carregarUltimaAtualizacao() {
    const { data } = await supabase
      .from('data_updates')
      .select('*')
      .eq('dataset', 'runways')
      .order('last_updated', { ascending: false })
      .limit(1)
      .single()
    
    if (data) {
      setUltimaAtualizacao(new Date(data.last_updated).toLocaleString())
    }
  }

  async function atualizarDadosPistas() {
    Alert.alert(
      'Atualizar Dados de Pistas',
      'Isso vai baixar os dados mais recentes do OurAirports e atualizar o banco. Pode levar alguns minutos. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Atualizar',
          onPress: async () => {
            try {
              setAtualizando(true)
              
              console.log("📡 Chamando função update-runways...")
              
              const { data, error } = await supabase.functions.invoke('update-runways')
              
              console.log("📦 Resposta:", data)
              console.log("❌ Erro:", error)
              
              if (error) {
                console.error("❌ Erro retornado:", error)
                throw new Error(error.message || 'Erro na comunicação com a função')
              }
              
              if (!data?.success) {
                throw new Error(data?.error || 'Falha na atualização')
              }
              
              setUltimaAtualizacao(new Date().toLocaleString())
              
              Alert.alert(
                '✅ Sucesso',
                data.message || 'Dados atualizados com sucesso!'
              )
              
              // Atualizar lista de denúncias
              await carregarDenuncias()
              
            } catch (error: any) {
              console.error("❌ Erro capturado:", error)
              Alert.alert('❌ Erro', error.message)
            } finally {
              setAtualizando(false)
            }
          }
        }
      ]
    )
  }

  function verDetalhesReporte(reporte: ReporteDenunciado) {
    setReporteSelecionado(reporte)
    setModalVisible(true)
  }

  async function removerReporte(id: number) {
    Alert.alert(
      'Remover Reporte',
      'Tem certeza? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('reports').update({ status: 'removido' }).eq('id', id)
            setModalVisible(false)
            carregarDenuncias()
          }
        }
      ]
    )
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
        <Text style={styles.headerTitle}>⚖️ Moderação</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Card de Atualização de Dados */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🛣️ Dados de Pistas</Text>
          <Text style={styles.cardDescription}>
            O OurAirports atualiza os dados diariamente. Clique no botão abaixo para baixar a versão mais recente.
          </Text>
          
          {ultimaAtualizacao && (
            <Text style={styles.updateInfo}>
              Última atualização: {ultimaAtualizacao}
            </Text>
          )}
          
          <TouchableOpacity
            style={[styles.updateButton, atualizando && styles.updateButtonDisabled]}
            onPress={atualizarDadosPistas}
            disabled={atualizando}
          >
            {atualizando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.updateButtonIcon}>📥</Text>
                <Text style={styles.updateButtonText}>Atualizar Dados de Pistas</Text>
              </>
            )}
          </TouchableOpacity>
          
          {atualizando && (
            <Text style={styles.loadingText}>
              Baixando e processando dados... Isso pode levar alguns minutos.
            </Text>
          )}
        </View>

        {/* Reports Denunciados */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚠️ Reports Denunciados ({reportsDenunciados.length})</Text>
          {reportsDenunciados.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum reporte denunciado</Text>
          ) : (
            reportsDenunciados.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.denunciaItem}
                onPress={() => verDetalhesReporte(item)}
              >
                <View style={styles.denunciaHeader}>
                  <Text style={styles.denunciaIcao}>{item.icao}</Text>
                  <View style={styles.denunciaBadge}>
                    <Text style={styles.denunciaBadgeText}>⚠️ {item.denuncias}</Text>
                  </View>
                </View>
                
                <Text style={styles.denunciaInfo}>
                  📅 {formatarData(item.reportado_em)} • 👤 {item.reportado_por?.split('@')[0]}
                </Text>
                
                <Text style={styles.denunciaPreview} numberOfLines={2}>
                  🛣️ {item.pista_condicao}
                </Text>
                
                {item.observacoes && (
                  <Text style={styles.denunciaPreview} numberOfLines={1}>
                    📝 {item.observacoes}
                  </Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Telefones Denunciados */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📞 Telefones Denunciados ({telefonesDenunciados.length})</Text>
          {telefonesDenunciados.map((item: any) => (
            <View key={item.id} style={styles.denunciaItem}>
              <Text style={styles.denunciaIcao}>{item.icao}</Text>
              <Text style={styles.denunciaInfo}>{item.telefone}</Text>
              <Text style={styles.denunciaInfo}>Denúncias: {item.denuncias}</Text>
              <TouchableOpacity 
                style={styles.removerButton}
                onPress={() => removerReporte(item.id)}
              >
                <Text style={styles.removerButtonText}>Remover</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Modal de Detalhes do Reporte */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              {reporteSelecionado && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>📋 Detalhes da Denúncia</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <Text style={styles.modalClose}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>📍 Aeroporto</Text>
                    <Text style={styles.modalValue}>{reporteSelecionado.icao}</Text>
                  </View>

                  <View style={styles.modalRow}>
                    <View style={[styles.modalSection, { flex: 1 }]}>
                      <Text style={styles.modalLabel}>📅 Data</Text>
                      <Text style={styles.modalValue}>
                        {formatarData(reporteSelecionado.reportado_em)}
                      </Text>
                    </View>
                    <View style={[styles.modalSection, { flex: 1 }]}>
                      <Text style={styles.modalLabel}>⚠️ Denúncias</Text>
                      <Text style={[styles.modalValue, styles.denunciaDestaque]}>
                        {reporteSelecionado.denuncias}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>✍️ Autor</Text>
                    <Text style={styles.modalValue}>{reporteSelecionado.reportado_por}</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>🛣️ Condição da Pista</Text>
                    <Text style={styles.modalText}>
                      {reporteSelecionado.pista_condicao}
                    </Text>
                  </View>

                  {reporteSelecionado.observacoes && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>📝 Observações</Text>
                      <Text style={styles.modalText}>
                        {reporteSelecionado.observacoes}
                      </Text>
                    </View>
                  )}

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.ignorarButton]}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.ignorarButtonText}>Fechar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalButton, styles.removerButton]}
                      onPress={() => removerReporte(reporteSelecionado.id)}
                    >
                      <Text style={styles.removerButtonText}>Remover Reporte</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    flex: 1,
    padding: 16
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a7ea4',
    marginBottom: 8
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20
  },
  updateInfo: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
    fontStyle: 'italic'
  },
  updateButton: {
    backgroundColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8
  },
  updateButtonDisabled: {
    backgroundColor: '#ccc'
  },
  updateButtonIcon: {
    fontSize: 18,
    color: '#fff'
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  },
  loadingText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic'
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20
  },
  denunciaItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8
  },
  denunciaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  denunciaIcao: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a7ea4'
  },
  denunciaBadge: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12
  },
  denunciaBadgeText: {
    fontSize: 12,
    color: '#c62828',
    fontWeight: 'bold'
  },
  denunciaInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6
  },
  denunciaPreview: {
    fontSize: 13,
    color: '#333',
    marginBottom: 2
  },
  removerButton: {
    backgroundColor: '#f44336',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8
  },
  removerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12
  },
  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a7ea4'
  },
  modalClose: {
    fontSize: 20,
    color: '#999'
  },
  modalSection: {
    marginBottom: 16
  },
  modalRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16
  },
  modalLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2
  },
  modalValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500'
  },
  modalText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6
  },
  denunciaDestaque: {
    color: '#c62828',
    fontWeight: 'bold'
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  ignorarButton: {
    backgroundColor: '#f5f5f5'
  },
  ignorarButtonText: {
    color: '#666',
    fontWeight: 'bold'
  }
})