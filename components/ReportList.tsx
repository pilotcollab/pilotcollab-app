import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import ReportDenuncia from './ReportDenuncia'

type Report = {
  id: number
  icao: string
  pista_condicao: string
  observacoes?: string
  reportado_por: string
  reportado_em: string
  denuncias?: number
  denunciado_por?: string[]
  status?: string
}

// COMPONENTE PARA CADA ITEM DA LISTA
const ReportItem = ({ 
  item, 
  onDenunciaPress, 
  onDeletePress,
  isAdmin,
  currentUser 
}: { 
  item: Report, 
  onDenunciaPress: (id: number, autor: string) => void,
  onDeletePress: (id: number, autor: string) => void,
  isAdmin: boolean,
  currentUser: any
}) => {
  
  function formatarData(data: string) {
    const date = new Date(data)
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: '2-digit',
      hour: '2-digit', 
      minute: '2-digit'
    }).replace(',', '')
  }

  // Verificar se pode apagar (próprio usuário ou admin)
  const podeApagar = isAdmin || currentUser?.email === item.reportado_por

  return (
    <View style={styles.reportItem}>
      <View style={styles.reportHeader}>
        <View>
          <Text style={styles.reportAuthor}>
            ✍️ {item.reportado_por?.split('@')[0]}
          </Text>
          <Text style={styles.reportDate}>
            {formatarData(item.reportado_em)}
          </Text>
        </View>
        
        <View style={styles.actionButtons}>
          {/* Botão de denúncia - só não aparece para o próprio autor */}
          {currentUser && currentUser.email !== item.reportado_por && (
            <TouchableOpacity 
              onPress={() => onDenunciaPress(item.id, item.reportado_por)}
              style={styles.denunciaButton}
            >
              <Text style={styles.denunciaButtonText}>⚠️</Text>
            </TouchableOpacity>
          )}
          
          {/* Botão de apagar - aparece para admin ou próprio autor */}
          {podeApagar && (
            <TouchableOpacity 
              onPress={() => onDeletePress(item.id, item.reportado_por)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Condição da Pista */}
      {item.pista_condicao ? (
        <View style={styles.detalheItem}>
          <Text style={styles.detalheLabel}>🛣️ Pista:</Text>
          <Text style={styles.detalheTexto}>{item.pista_condicao}</Text>
        </View>
      ) : null}
      
      {/* Observações */}
      {item.observacoes ? (
        <View style={styles.detalheItem}>
          <Text style={styles.detalheLabel}>📝 Observações:</Text>
          <Text style={styles.detalheTexto}>{item.observacoes}</Text>
        </View>
      ) : null}

      {/* Mostrar contagem de denúncias (só se houver) */}
      {item.denuncias ? (
        <Text style={styles.denunciaCount}>
          ⚠️ {item.denuncias} denúncia(s)
        </Text>
      ) : null}
    </View>
  )
}

export default function ReportList({ icao }: { icao: string }) {
  const { user } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [denunciaModal, setDenunciaModal] = useState({ visible: false, reportId: 0, autor: '' })

  useEffect(() => {
    if (user) {
      verificarAdmin()
    }
    loadReports()
  }, [icao, user])

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
      console.error('Erro ao verificar admin:', error)
      setIsAdmin(false)
    }
  }

  async function loadReports() {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('icao', icao)
        .eq('status', 'ativo')
        .order('reportado_em', { ascending: false })
        .limit(20)

      if (error) throw error
      setReports(data || [])
    } catch (error) {
      console.error('Erro ao carregar reports:', error)
      Alert.alert('Erro', 'Não foi possível carregar os reportes')
    } finally {
      setLoading(false)
    }
  }

  async function apagarReport(id: number, autor: string) {
    const mensagem = isAdmin 
      ? `Remover reporte de ${autor}?` 
      : 'Remover seu reporte?'

    Alert.alert(
      'Confirmar exclusão',
      mensagem,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Se for admin, pode apagar qualquer um (muda status)
              if (isAdmin) {
                const { error } = await supabase
                  .from('reports')
                  .update({ status: 'removido' })
                  .eq('id', id)

                if (error) throw error
                Alert.alert('Sucesso', 'Reporte removido pela moderação')
              } 
              // Se for o próprio autor, pode apagar permanentemente
              else {
                const { error } = await supabase
                  .from('reports')
                  .delete()
                  .eq('id', id)

                if (error) throw error
                Alert.alert('Sucesso', 'Seu reporte foi apagado')
              }
              
              loadReports() // Recarregar lista
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível apagar o reporte')
            }
          }
        }
      ]
    )
  }

  function abrirDenuncia(reportId: number, autor: string) {
    setDenunciaModal({ visible: true, reportId, autor })
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0a7ea4" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* CABEÇALHO COM EXPANSOR */}
      <TouchableOpacity 
        style={styles.header} 
        onPress={() => setExpandido(!expandido)}
      >
        <Text style={styles.title}>📋 Histórico de Reportes ({reports.length})</Text>
        <Text style={styles.expandButton}>{expandido ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {/* CONTEÚDO - SÓ MOSTRA SE EXPANDIDO */}
      {expandido && (
        reports.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum reporte ainda para {icao}</Text>
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <ReportItem 
                item={item} 
                onDenunciaPress={abrirDenuncia}
                onDeletePress={apagarReport}
                isAdmin={isAdmin}
                currentUser={user}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )
      )}

      {/* Modal de Denúncia */}
      <ReportDenuncia
        reportId={denunciaModal.reportId}
        reportado_por={denunciaModal.autor}
        visible={denunciaModal.visible}
        onClose={() => setDenunciaModal({ visible: false, reportId: 0, autor: '' })}
        onDenunciaEnviada={loadReports}
      />
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
    fontSize: 13,
    paddingVertical: 20
  },
  reportItem: {
    paddingVertical: 12
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  reportAuthor: {
    fontSize: 13,
    color: '#0a7ea4',
    fontWeight: '600'
  },
  reportDate: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
    marginTop: 2
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  denunciaButton: {
    padding: 8,
    backgroundColor: '#ffebee',
    borderRadius: 4
  },
  denunciaButtonText: {
    fontSize: 16
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#ffebee',
    borderRadius: 4
  },
  deleteButtonText: {
    fontSize: 16
  },
  detalheItem: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  detalheLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2
  },
  detalheTexto: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18
  },
  denunciaCount: {
    fontSize: 11,
    color: '#f44336',
    marginTop: 8,
    fontStyle: 'italic'
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 4
  }
})