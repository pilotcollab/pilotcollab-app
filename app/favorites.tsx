import { useFocusEffect, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useRef, useState } from "react"
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
} from "react-native"
import { useFavorites } from "../lib/FavoritesContext"
import { buscarMetarComFallback } from "../lib/noaaBackup"
import { supabase } from "../lib/supabase"

export default function Favorites() {
  const router = useRouter()
  const { favorites, removeFavorite, addFavorite, updateMetar, loading: favoritesLoading } = useFavorites()
  const [atualizando, setAtualizando] = useState<string | null>(null)
  const [atualizandoTodos, setAtualizandoTodos] = useState(false)
  const [novoICAO, setNovoICAO] = useState("")
  const [adicionando, setAdicionando] = useState(false)
  const [carregandoInicial, setCarregandoInicial] = useState(true)
  const [updateTrigger, setUpdateTrigger] = useState(0)
  
  const primeiraExecucao = useRef(true)

  // 👇 Monitora mudanças nos favoritos e força atualização
  useEffect(() => {
    console.log('🔄 Favoritos mudaram. Total:', favorites.length)
    setUpdateTrigger(prev => prev + 1)
  }, [favorites])

  useFocusEffect(
    useCallback(() => {
      console.log('📱 Tela de favoritos recebeu foco')
      if (favorites.length > 0) {
        atualizarTodosAoAbrir()
      }
    }, [favorites.length])
  )

  useEffect(() => {
    if (primeiraExecucao.current) {
      primeiraExecucao.current = false
      
      if (favorites.length > 0) {
        console.log('🚀 Primeira execução')
        atualizarTodosAoAbrir()
      } else {
        setCarregandoInicial(false)
      }
    }
  }, [])

  const atualizarTodosAoAbrir = async () => {
    if (favorites.length === 0) {
      setCarregandoInicial(false)
      return
    }
    
    setCarregandoInicial(true)
    console.log('🔄 Atualização automática de', favorites.length, 'favoritos')
    
    for (const fav of favorites) {
      try {
        console.log(`📡 Buscando METAR para ${fav.icao}...`)
        const metarResult = await buscarMetarComFallback(fav.icao)
        
        if (metarResult.metar && metarResult.metar !== "METAR não disponível") {
          console.log(`✅ METAR obtido para ${fav.icao}`)
          await updateMetar(fav.icao, metarResult.metar)
        } else {
          console.log(`⏭️ ${fav.icao} sem METAR disponível`)
        }
      } catch (error) {
        console.error(`❌ Erro ao atualizar ${fav.icao}:`, error)
      }
    }
    
    console.log(`📊 Atualização automática concluída`)
    setCarregandoInicial(false)
  }

  const confirmarRemover = (icao: string) => {
    Alert.alert(
      "Remover favorito",
      `Deseja remover ${icao} dos favoritos?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Remover", 
          onPress: () => {
            removeFavorite(icao)
          },
          style: "destructive"
        }
      ]
    )
  }

  const atualizarMetar = async (icao: string) => {
    try {
      setAtualizando(icao)
      
      console.log(`📡 Atualizando manual ${icao}...`)
      const metarResult = await buscarMetarComFallback(icao)
      
      if (metarResult.metar && metarResult.metar !== "METAR não disponível") {
        console.log(`✅ METAR atualizado para ${icao}`)
        await updateMetar(icao, metarResult.metar)
      } else {
        console.log(`⏭️ ${icao} sem METAR disponível`)
      }
    } catch (error) {
      console.log(`⚠️ Erro ao atualizar ${icao}:`, error)
    } finally {
      setAtualizando(null)
    }
  }

  const atualizarTodos = async () => {
    if (favorites.length === 0 || atualizandoTodos) return
    
    setAtualizandoTodos(true)
    console.log('🔄 Atualização manual de TODOS...')
    
    for (const fav of favorites) {
      try {
        console.log(`📡 Buscando METAR para ${fav.icao}...`)
        const metarResult = await buscarMetarComFallback(fav.icao)
        
        if (metarResult.metar && metarResult.metar !== "METAR não disponível") {
          console.log(`✅ METAR obtido para ${fav.icao}`)
          await updateMetar(fav.icao, metarResult.metar)
        } else {
          console.log(`⏭️ ${fav.icao} sem METAR disponível`)
        }
      } catch (error) {
        console.error(`❌ Erro ao atualizar ${fav.icao}:`, error)
      }
    }
    
    console.log(`📊 Atualização manual concluída`)
    setAtualizandoTodos(false)
  }

  const adicionarNovoFavorito = async () => {
    if (novoICAO.length !== 4) {
      Alert.alert('Atenção', 'Digite um código ICAO válido (4 letras)')
      return
    }

    const icaoUpper = novoICAO.toUpperCase()

    if (favorites.some(f => f.icao === icaoUpper)) {
      Alert.alert('Atenção', 'Este aeroporto já está nos favoritos')
      setNovoICAO('')
      return
    }

    setAdicionando(true)
    try {
      const { data: rotaerData, error: rotaerError } = await supabase.functions.invoke("aisweb-proxy", {
        body: { icao: icaoUpper, area: "rotaer" }
      })

      if (rotaerError) throw new Error(rotaerError.message)

      let metarInicial = ''
      try {
        const metarResult = await buscarMetarComFallback(icaoUpper)
        metarInicial = metarResult.metar || ''
      } catch {
        // Se falhar, continua sem METAR
      }

      await addFavorite({
        icao: icaoUpper,
        nome: rotaerData.nome || 'Nome não disponível',
        cidade: rotaerData.cidade || '?',
        uf: rotaerData.uf || '?',
        metar: metarInicial,
        lastUpdated: Date.now()
      })

      setNovoICAO('')
      
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível adicionar o aeroporto')
    } finally {
      setAdicionando(false)
    }
  }

  if (favoritesLoading || carregandoInicial) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>⭐ Favoritos</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <Text style={styles.loadingText}>
            {favoritesLoading ? "Carregando favoritos..." : "Atualizando METARs..."}
          </Text>
        </View>
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
        <Text style={styles.headerTitle}>⭐ Favoritos</Text>
        <View style={styles.headerButtons}>
          {favorites.length > 0 && (
            <TouchableOpacity 
              onPress={atualizarTodos}
              style={styles.updateAllButton}
              disabled={atualizandoTodos}
            >
              {atualizandoTodos ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.updateAllButtonText}>↻</Text>
              )}
            </TouchableOpacity>
          )}
          <View style={{ width: 40 }} />
        </View>
      </View>

      <View style={styles.addContainer}>
        <TextInput
          style={styles.addInput}
          placeholder="SBSP"
          placeholderTextColor="#999"
          value={novoICAO}
          onChangeText={setNovoICAO}
          maxLength={4}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <TouchableOpacity 
          style={[styles.addButton, adicionando && styles.addButtonDisabled]}
          onPress={adicionarNovoFavorito}
          disabled={adicionando}
        >
          {adicionando ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>+</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        key={`favorites-${updateTrigger}`}
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>⭐</Text>
            <Text style={styles.emptyTitle}>Nenhum favorito</Text>
            <Text style={styles.emptyText}>
              Digite um código ICAO acima para adicionar
            </Text>
          </View>
        ) : (
          favorites.map((fav) => (
            <View key={`${fav.icao}-${fav.lastUpdated || fav.metar || ''}`} style={styles.card}>
              <TouchableOpacity
                style={styles.cardTouchable}
                onPress={() => router.push(`/airport/${fav.icao}`)}
                activeOpacity={0.7}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.icao}>{fav.icao}</Text>
                  <Text style={styles.metar} numberOfLines={3}>
                    {fav.metar || "Sem METAR"}
                  </Text>
                </View>
              </TouchableOpacity>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  onPress={() => atualizarMetar(fav.icao)}
                  style={styles.updateButton}
                  disabled={atualizando === fav.icao}
                >
                  {atualizando === fav.icao ? (
                    <ActivityIndicator size="small" color="#0a7ea4" />
                  ) : (
                    <Text style={styles.updateButtonText}>↻</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => confirmarRemover(fav.icao)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5"
  },
  header: {
    backgroundColor: "#0a7ea4",
    padding: 16,
    paddingTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff"
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center"
  },
  backButtonText: {
    fontSize: 24,
    color: "#fff"
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  updateAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4caf50",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  updateAllButtonText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  addContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  addInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    textAlign: 'center',
    letterSpacing: 2,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    width: 50,
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#999",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 6,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  cardTouchable: {
    flex: 1,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  icao: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0a7ea4",
    width: 48,
  },
  metar: {
    fontSize: 12,
    fontFamily: "monospace",
    color: "#666",
    flex: 1,
    lineHeight: 18,
    flexWrap: "wrap",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 4,
    marginLeft: 6,
  },
  updateButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
  },
  updateButtonText: {
    fontSize: 14,
    color: "#0a7ea4",
    fontWeight: "bold",
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ffebee",
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    fontSize: 12,
    color: "#c62828",
    fontWeight: "bold",
  },
})