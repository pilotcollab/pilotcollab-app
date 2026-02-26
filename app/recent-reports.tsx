import { useFocusEffect, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useCallback, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native"
import { supabase } from "../lib/supabase"

type Reporte = {
  id: number
  icao: string
  tipo: 'pista' | 'combustivel'
  conteudo: string
  observacoes?: string
  reportado_por: string
  reportado_em: string
  denuncias?: number
}

export default function RecentReports() {
  const router = useRouter()
  const [reportes, setReportes] = useState<Reporte[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [atualizando, setAtualizando] = useState(false)

  // 👈 CORRIGIDO: useFocusEffect em vez de router.addListener
  useFocusEffect(
    useCallback(() => {
      console.log('📋 Tela de reportes recebeu foco - recarregando...')
      carregarUltimosReportes()
    }, [])
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await carregarUltimosReportes()
    setRefreshing(false)
  }, [])

  const atualizarTodos = async () => {
    if (atualizando) return
    
    setAtualizando(true)
    await carregarUltimosReportes()
    setAtualizando(false)
  }

  async function carregarUltimosReportes() {
    try {
      setLoading(true)
      
      console.log('📋 Carregando últimos reportes...')
      
      // Buscar reports de pista
      const { data: pistaData, error: pistaError } = await supabase
        .from('reports')
        .select('*')
        .eq('status', 'ativo')
        .order('reportado_em', { ascending: false })
        .limit(20)

      if (pistaError) throw pistaError

      // Buscar reports de combustível
      const { data: combustivelData, error: combustivelError } = await supabase
        .from('reports_combustivel')
        .select('*')
        .eq('status', 'ativo')
        .order('reportado_em', { ascending: false })
        .limit(20)

      if (combustivelError) throw combustivelError

      // Formatar dados de combustível
      const combustivelFormatado = (combustivelData || []).map((item: any) => {
        // Extrair equipamentos do JSON
        let equipamentosTexto = 'Combustível'
        if (item.equipamentos && Array.isArray(item.equipamentos)) {
          equipamentosTexto = item.equipamentos.join(', ')
        } else if (item.equipamento_principal) {
          equipamentosTexto = item.equipamento_principal
        }

        return {
          id: item.id,
          icao: item.icao,
          tipo: 'combustivel' as const,
          conteudo: `⛽ ${equipamentosTexto}`,
          observacoes: item.observacoes,
          reportado_por: item.reportado_por,
          reportado_em: item.reportado_em,
          denuncias: item.denuncias
        }
      })

      // Formatar dados de pista
      const pistaFormatado = (pistaData || []).map((item: any) => ({
        id: item.id,
        icao: item.icao,
        tipo: 'pista' as const,
        conteudo: `🛣️ ${item.pista_condicao}`,
        observacoes: item.observacoes,
        reportado_por: item.reportado_por,
        reportado_em: item.reportado_em,
        denuncias: item.denuncias
      }))

      // Combinar e ordenar por data
      const todos = [...pistaFormatado, ...combustivelFormatado]
        .sort((a, b) => new Date(b.reportado_em).getTime() - new Date(a.reportado_em).getTime())
        .slice(0, 30) // Limitar a 30 resultados

      console.log(`📋 ${todos.length} reportes carregados`)
      setReportes(todos)
    } catch (error) {
      console.error('Erro ao carregar reportes:', error)
      Alert.alert('Erro', 'Não foi possível carregar os reportes')
    } finally {
      setLoading(false)
    }
  }

  function formatarData(data: string) {
    const date = new Date(data)
    const agora = new Date()
    const diffHoras = Math.floor((agora.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffHoras < 1) return 'há poucos minutos'
    if (diffHoras === 1) return 'há 1 hora'
    if (diffHoras < 24) return `há ${diffHoras} horas`
    return date.toLocaleDateString('pt-BR')
  }

  function getTipoIcone(tipo: 'pista' | 'combustivel') {
    return tipo === 'pista' ? '🛣️' : '⛽'
  }

  if (loading && !refreshing && !atualizando) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={styles.loadingText}>Carregando reportes...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📋 Últimos Reportes</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            onPress={atualizarTodos} 
            style={styles.updateAllButton}
            disabled={atualizando}
          >
            {atualizando ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.updateAllButtonText}>↻</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0a7ea4"]}
            tintColor="#0a7ea4"
          />
        }
      >
        {reportes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>Nenhum reporte</Text>
            <Text style={styles.emptyText}>
              Ainda não há reportes de condições de pista ou combustível
            </Text>
          </View>
        ) : (
          reportes.map((reporte) => (
            <TouchableOpacity
              key={`${reporte.tipo}-${reporte.id}`}
              style={styles.card}
              onPress={() => router.push(`/airport/${reporte.icao}`)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={styles.icaoContainer}>
                  <Text style={styles.icao}>{reporte.icao}</Text>
                  <Text style={styles.tipoTag}>
                    {getTipoIcone(reporte.tipo)} {reporte.tipo === 'pista' ? 'Pista' : 'Combustível'}
                  </Text>
                </View>
                <Text style={styles.timestamp}>{formatarData(reporte.reportado_em)}</Text>
              </View>

              <View style={styles.conteudoContainer}>
                <Text style={styles.conteudo}>{reporte.conteudo}</Text>
              </View>

              {reporte.observacoes ? (
                <View style={styles.observacoesContainer}>
                  <Text style={styles.observacoesLabel}>📝 Observações:</Text>
                  <Text style={styles.observacoesTexto}>{reporte.observacoes}</Text>
                </View>
              ) : null}

              <Text style={styles.reportAuthor}>
                ✍️ {reporte.reportado_por.split('@')[0]}
              </Text>

              {reporte.denuncias ? (
                <Text style={styles.denunciaBadge}>⚠️ {reporte.denuncias}</Text>
              ) : null}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  loadingText: {
    marginTop: 10,
    color: '#666'
  },
  header: {
    backgroundColor: '#0a7ea4',
    padding: 16,
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff'
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  backButtonText: {
    fontSize: 24,
    color: '#fff'
  },
  updateAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4caf50",
    justifyContent: "center",
    alignItems: "center",
  },
  updateAllButtonText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  content: {
    flex: 1
  },
  contentContainer: {
    padding: 16
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 16,
    opacity: 0.5
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  icaoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  icao: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a7ea4'
  },
  tipoTag: {
    fontSize: 11,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  timestamp: {
    fontSize: 11,
    color: '#999'
  },
  conteudoContainer: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8
  },
  conteudo: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20
  },
  observacoesContainer: {
    marginBottom: 8
  },
  observacoesLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2
  },
  observacoesTexto: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic'
  },
  reportAuthor: {
    fontSize: 11,
    color: '#0a7ea4',
    marginBottom: 4
  },
  denunciaBadge: {
    fontSize: 10,
    color: '#f44336',
    alignSelf: 'flex-start'
  }
})