import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { supabase } from '../lib/supabase'

type Freela = {
  id: string
  usuario_id: string
  equipamentos: string[]
  observacoes: string
  atualizado_em: string
  expira_em: string // 👈 ADICIONADO
  perfis: {
    nome_completo: string
    uf: string
    whatsapp: string
    pic: boolean
    sic: boolean
  } | null
  aeronaves_piloto?: {
    tipo_icao: string
    descricao: string
  }[]
}

export default function BuscaFreelas() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [freelas, setFreelas] = useState<Freela[]>([])
  const [filtro, setFiltro] = useState('')

  useEffect(() => {
    carregarFreelas()
  }, [])

  async function carregarFreelas() {
    try {
      setLoading(true)
      
      // Buscar disponibilidades
      const { data: disponibilidades, error: err1 } = await supabase
        .from('disponibilidade_freela')
        .select('*')
        .eq('disponivel', true)
        .gte('expira_em', new Date().toISOString())
        .order('atualizado_em', { ascending: false })

      if (err1) throw err1

      if (!disponibilidades || disponibilidades.length === 0) {
        setFreelas([])
        return
      }

      // Buscar perfis e aeronaves para cada disponibilidade
      const freelasCompletas = await Promise.all(
        disponibilidades.map(async (disp) => {
          // Buscar perfil do piloto
          const { data: perfil } = await supabase
            .from('perfis')
            .select('nome_completo, uf, whatsapp, pic, sic')
            .eq('id', disp.usuario_id)
            .single()

          // Buscar aeronaves do piloto
          const { data: aeronaves } = await supabase
            .from('aeronaves_piloto')
            .select('tipo_icao, descricao')
            .eq('usuario_id', disp.usuario_id)

          return {
            ...disp,
            perfis: perfil || null,
            aeronaves_piloto: aeronaves || []
          }
        })
      )

      setFreelas(freelasCompletas)
    } catch (error) {
      console.error('Erro ao carregar freelas:', error)
      Alert.alert('Erro', 'Não foi possível carregar as disponibilidades')
    } finally {
      setLoading(false)
    }
  }

  function abrirWhatsApp(numero: string, nome: string) {
    if (!numero) {
      Alert.alert('Atenção', `${nome} não cadastrou WhatsApp`)
      return
    }
    
    const numeroLimpo = numero.replace(/\D/g, '')
    const url = `whatsapp://send?phone=55${numeroLimpo}`
    
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://wa.me/55${numeroLimpo}`).catch(() => {
        Alert.alert('Erro', 'Não foi possível abrir o WhatsApp')
      })
    })
  }

  const freelasFiltradas = freelas.filter(item => {
    if (!filtro) return true
    return item.equipamentos?.some(equip => 
      equip.toLowerCase().includes(filtro.toLowerCase())
    )
  })

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
        <Text style={styles.headerTitle}>🔍 Buscar Freelas</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Filtrar por equipamento (ex: B733, A320)"
          value={filtro}
          onChangeText={setFiltro}
          autoCapitalize="characters"
          maxLength={4}
        />
        <Text style={styles.searchHint}>
          Digite o código ICAO da aeronave (4 letras/números)
        </Text>
      </View>

      <FlatList
        data={freelasFiltradas}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💼</Text>
            <Text style={styles.emptyTitle}>Nenhum piloto disponível</Text>
            <Text style={styles.emptyText}>
              {filtro 
                ? `Nenhum piloto com equipamento ${filtro.toUpperCase()} no momento`
                : 'Não há pilotos disponíveis para freela no momento'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Text style={styles.pilotoNome}>
                  {item.perfis?.nome_completo || 'Nome não informado'}
                </Text>
                
                {/* Badges de PIC/SIC */}
                <View style={styles.funcaoBadges}>
                  {item.perfis?.pic && (
                    <View style={[styles.funcaoBadge, styles.picBadge]}>
                      <Text style={styles.funcaoBadgeText}>PIC</Text>
                    </View>
                  )}
                  {item.perfis?.sic && (
                    <View style={[styles.funcaoBadge, styles.sicBadge]}>
                      <Text style={styles.funcaoBadgeText}>SIC</Text>
                    </View>
                  )}
                </View>

                {/* Múltiplos equipamentos */}
                <View style={styles.equipamentosContainer}>
                  {item.equipamentos?.map((equip, index) => (
                    <View key={index} style={styles.equipamentoTag}>
                      <Text style={styles.equipamentoTagText}>{equip}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.localizacao}>
                  📍 Base: {item.perfis?.uf || 'UF não informada'}
                </Text>
              </View>
              
              <TouchableOpacity
                style={[styles.whatsappButton, !item.perfis?.whatsapp && styles.disabledButton]}
                onPress={() => abrirWhatsApp(
                  item.perfis?.whatsapp || '', 
                  item.perfis?.nome_completo || 'Piloto'
                )}
                disabled={!item.perfis?.whatsapp}
              >
                <Text style={styles.whatsappButtonText}>📱 WhatsApp</Text>
              </TouchableOpacity>
            </View>

            {item.observacoes && (
              <Text style={styles.observacoes}>📝 {item.observacoes}</Text>
            )}

            <Text style={styles.atualizado}>
              🕐 Disponível até {new Date(item.expira_em).toLocaleDateString()}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  searchContainer: { padding: 16, backgroundColor: '#fff' },
  searchInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    textAlign: 'center',
    letterSpacing: 2,
    fontWeight: '600'
  },
  searchHint: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
    textAlign: 'center',
    fontStyle: 'italic'
  },
  list: { padding: 16 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 50, marginBottom: 16, opacity: 0.5 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#999', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', paddingHorizontal: 20 },
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
    alignItems: 'flex-start',
    marginBottom: 8
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 12
  },
  pilotoNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  funcaoBadges: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8
  },
  funcaoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start'
  },
  picBadge: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#0a7ea4'
  },
  sicBadge: {
    backgroundColor: '#e8f5e8',
    borderWidth: 1,
    borderColor: '#4caf50'
  },
  funcaoBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333'
  },
  equipamentosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8
  },
  equipamentoTag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#0a7ea4'
  },
  equipamentoTagText: {
    fontSize: 12,
    color: '#0a7ea4',
    fontWeight: '600'
  },
  localizacao: { fontSize: 13, color: '#666' },
  whatsappButton: {
    backgroundColor: '#25D366',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center'
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.5
  },
  whatsappButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  observacoes: { fontSize: 13, color: '#333', marginBottom: 8, lineHeight: 18 },
  atualizado: { fontSize: 11, color: '#999', fontStyle: 'italic' }
})