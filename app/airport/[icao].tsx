import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native"
import AirportReport from "../../components/AirportReport"
import CombustivelStatus from "../../components/CombustivelStatus"
import FrequenciasRadio from "../../components/FrequenciasRadio"
import ReportList from "../../components/ReportList"
import TelefonesUteis from "../../components/TelefonesUteis"
import { useAuth } from "../../lib/AuthContext"
import { useFavorites } from "../../lib/FavoritesContext"
import { buscarMetarComFallback } from "../../lib/noaaBackup"
import { supabase } from "../../lib/supabase"

export default function Airport() {
  const params = useLocalSearchParams()
  const icao = params.icao as string
  const router = useRouter()
  const { addFavorite, removeFavorite, isFavorite, updateMetar } = useFavorites()
  const { user, loading: authLoading } = useAuth()

  const [dados, setDados] = useState<any>(null)
  const [metar, setMetar] = useState<string | null>(null)
  const [taf, setTaf] = useState<string | null>(null)
  const [frequencias, setFrequencias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [metarSource, setMetarSource] = useState<'aisweb' | 'noaa' | null>(null)
  const [metarWarning, setMetarWarning] = useState<string | null>(null)

  const favorito = isFavorite(icao)

  useEffect(() => {
    if (icao) {
      buscarDados()
    }
  }, [icao])

  function abrirPaginaAISWEB() {
    const url = `https://aisweb.decea.mil.br/?i=aerodromos&codigo=${icao.toLowerCase()}`
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir a página do AISWEB')
    })
  }

  async function buscarDados() {
    try {
      setLoading(true)
      setError(null)
      setMetarWarning(null)

      // Busca ROTAER (dados do aeroporto) - ESSENCIAL
      console.log("🔍 Buscando dados ROTAER para ICAO:", icao)
      const { data: rotaerData, error: rotaerError } = await supabase.functions.invoke("aisweb-proxy", {
        body: { icao: icao, area: "rotaer" }
      })

      if (rotaerError) {
        console.log("❌ Erro no ROTAER:", rotaerError)
        setError("Não foi possível carregar os dados do aeroporto")
        setLoading(false)
        return
      }
      
      if (rotaerData) {
        console.log("✅ Dados ROTAER recebidos")
        setDados(rotaerData)
        if (rotaerData.frequencias) {
          setFrequencias(rotaerData.frequencias)
        }
      }

      // Busca METAR/TAF (NÃO ESSENCIAL) - NÃO BLOQUEIA A TELA
      try {
        console.log("📡 Buscando METAR/TAF...")
        const metarResult = await buscarMetarComFallback(icao)
        
        setMetar(metarResult.metar)
        setTaf(metarResult.taf)
        setMetarSource(metarResult.source)
        
        if (metarResult.warning) {
          setMetarWarning(metarResult.warning)
        }

        if (favorito && metarResult.metar) {
          updateMetar(icao, metarResult.metar)
        }
      } catch (metError: any) {
        // METAR/TAF falhou, mas não é problema - só avisa
        console.log("⚠️ METAR/TAF indisponível:", metError.message)
        setMetar(null)
        setTaf(null)
        setMetarWarning("METAR/TAF indisponível no momento")
      }

    } catch (err: any) {
      console.log("❌ Erro inesperado:", err.message)
      setError("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  function toggleFavorito() {
    if (favorito) {
      removeFavorite(icao)
      Alert.alert("✅ Removido", `${icao} removido dos favoritos`)
    } else {
      if (dados) {
        addFavorite({
          icao: icao,
          nome: dados.nome,
          cidade: dados.cidade,
          uf: dados.uf,
          metar: metar || ''
        })
        Alert.alert("⭐ Adicionado", `${icao} adicionado aos favoritos`)
      }
    }
  }

  function handleReportUpdate() {
    setRefreshKey(prev => prev + 1)
    buscarDados()
  }

  if (loading || authLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text>Carregando {icao}...</Text>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>{icao}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={toggleFavorito} style={styles.favoriteButton}>
            <Text style={styles.headerText}>{favorito ? "★" : "☆"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={buscarDados}>
            <Text style={styles.headerText}>↻</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card de Informações com Logo AISWEB */}
          {dados && (
            <View style={styles.card}>
              <View style={styles.infoHeader}>
                <Text style={styles.nome}>{dados.nome}</Text>
                <TouchableOpacity onPress={abrirPaginaAISWEB} style={styles.aiswebButton}>
                  <Image 
                    source={require("../../assets/images/aisweb.png")}
                    style={styles.aiswebLogo}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Cidade:</Text>
                <Text style={styles.infoValue}>{dados.cidade} - {dados.uf}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>UTC:</Text>
                <Text style={styles.infoValue}>{dados.utc}</Text>
              </View>
              
              {dados.iata !== "N/A" && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>IATA:</Text>
                  <Text style={styles.infoValue}>{dados.iata}</Text>
                </View>
              )}
            </View>
          )}

          {/* FREQUÊNCIAS DE RÁDIO */}
          <FrequenciasRadio frequencias={frequencias} />

          {/* AVISO DE METAR INDISPONÍVEL */}
          {metarWarning && !metar && (
            <View style={styles.warningCard}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>{metarWarning}</Text>
            </View>
          )}

          {/* METAR */}
          {metar && (
            <View style={styles.card}>
              <View style={styles.tituloContainer}>
                <Text style={styles.titulo}>📡 METAR</Text>
                {metarSource === 'noaa' && (
                  <View style={styles.sourceBadge}>
                    <Text style={styles.sourceBadgeText}>NOAA</Text>
                  </View>
                )}
              </View>
              <Text style={styles.metar}>{metar}</Text>
            </View>
          )}

          {/* TAF */}
          {taf && (
            <View style={styles.card}>
              <View style={styles.tituloContainer}>
                <Text style={styles.titulo}>🔮 TAF</Text>
                {metarSource === 'noaa' && (
                  <View style={styles.sourceBadge}>
                    <Text style={styles.sourceBadgeText}>NOAA</Text>
                  </View>
                )}
              </View>
              <Text style={styles.metar}>{taf}</Text>
            </View>
          )}

          {/* Combustível */}
          <CombustivelStatus icao={icao} />

          {/* Reporte de Pista */}
          <AirportReport icao={icao} onUpdate={handleReportUpdate} />
          
          {/* Histórico de Reportes */}
          <ReportList key={refreshKey} icao={icao} />
          
          {/* Telefones Úteis */}
          <TelefonesUteis icao={icao} />
          
          {/* Espaço extra no final */}
          <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1
  },
  header: { 
    backgroundColor: '#0a7ea4', 
    padding: 15, 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10
  },
  headerText: { 
    color: '#fff', 
    fontSize: 20 
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 15
  },
  favoriteButton: {
    marginRight: 5
  },
  content: { 
    flex: 1,
    padding: 15 
  },
  card: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3
  },
  // ESTILOS COMPLETOS PARA O HEADER COM LOGO
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nome: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#0a7ea4',
    flex: 1,
    marginRight: 10,
  },
  aiswebButton: {
    padding: 5,
  },
  aiswebLogo: {
    width: 40,
    height: 40,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    width: 60,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  tituloContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  titulo: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#0a7ea4' 
  },
  sourceBadge: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  sourceBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  metar: { 
    fontSize: 12, 
    fontFamily: 'monospace' 
  },
  bottomSpace: {
    height: 50
  },
  errorIcon: {
    fontSize: 50,
    marginBottom: 16,
    opacity: 0.5
  },
  errorText: {
    color: '#c62828',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20
  },
  backButton: {
    backgroundColor: '#0a7ea4',
    padding: 10,
    borderRadius: 5
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  warningCard: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffc107'
  },
  warningIcon: {
    fontSize: 20,
    marginBottom: 4,
    textAlign: 'center'
  },
  warningText: {
    color: '#856404',
    textAlign: 'center',
    fontSize: 13
  }
})