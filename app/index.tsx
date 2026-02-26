import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useRef, useState } from "react"
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native"

export default function Home() {
  const [icao, setIcao] = useState("")
  const router = useRouter()
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start()
  }, [])

  function consultar() {
    if (icao.length === 4) {
      router.push(`/airport/${icao.toUpperCase()}`)
      setIcao("")
    }
  }

  function irParaFavoritos() {
    router.push('/favorites' as any)
  }

  function irParaUltimosReportes() {
    router.push('/recent-reports' as any)
  }

  function irParaBuscaFreelas() {
    router.push('/busca-freelas' as any)
  }

  function irParaTermoDeUso() {
    router.push('/termo-de-uso' as any)
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image 
                source={require("../assets/images/icon.png")} 
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.title}>Pilot Collab</Text>
              <Text style={styles.subtitle}>
                Informações colaborativas
              </Text>
            </View>

            {/* Card de Busca */}
            <View style={styles.searchCard}>
              <Text style={styles.searchLabel}>ICAO</Text>
              <TextInput
                style={styles.input}
                placeholder="SBSP, SBGR..."
                placeholderTextColor="#999"
                value={icao}
                onChangeText={setIcao}
                maxLength={4}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={consultar}
                blurOnSubmit={false}
              />
              
              <TouchableOpacity 
                style={[styles.searchButton, icao.length !== 4 && styles.searchButtonDisabled]} 
                onPress={consultar}
                disabled={icao.length !== 4}
                activeOpacity={0.7}
              >
                <Text style={styles.searchButtonText}>Buscar</Text>
              </TouchableOpacity>
            </View>

            {/* Card de Favoritos */}
            <TouchableOpacity 
              style={styles.menuCard}
              onPress={irParaFavoritos}
              activeOpacity={0.7}
            >
              <View style={styles.menuContent}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#fff3e0' }]}>
                  <Text style={styles.menuIcon}>⭐</Text>
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Favoritos</Text>
                  <Text style={styles.menuSubtitle}>Seus aeroportos salvos</Text>
                </View>
                <Text style={styles.menuArrow}>→</Text>
              </View>
            </TouchableOpacity>

            {/* Card de Últimos Reportes */}
            <TouchableOpacity 
              style={styles.menuCard}
              onPress={irParaUltimosReportes}
              activeOpacity={0.7}
            >
              <View style={styles.menuContent}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#e8f5e8' }]}>
                  <Text style={styles.menuIcon}>📋</Text>
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Últimos Reportes</Text>
                  <Text style={styles.menuSubtitle}>Condições recentes de pista</Text>
                </View>
                <Text style={styles.menuArrow}>→</Text>
              </View>
            </TouchableOpacity>

            {/* Card de Busca de Freelas (NOVO) */}
            <TouchableOpacity 
              style={styles.menuCard}
              onPress={irParaBuscaFreelas}
              activeOpacity={0.7}
            >
              <View style={styles.menuContent}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#e3f2fd' }]}>
                  <Text style={styles.menuIcon}>💼</Text>
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Freelas</Text>
                  <Text style={styles.menuSubtitle}>Pilotos disponíveis</Text>
                </View>
                <Text style={styles.menuArrow}>→</Text>
              </View>
            </TouchableOpacity>

            {/* Dica Rápida */}
            <View style={styles.tipContainer}>
              <Text style={styles.tipIcon}>💡</Text>
              <View style={styles.tipTextContainer}>
                <Text style={styles.tipTitle}>Dica rápida</Text>
                <Text style={styles.tipText}>
                  Faça login para reportar condições da pista, combustível e se cadastrar no Freelas
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Rodapé */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={irParaTermoDeUso}>
              <Text style={styles.footerLink}>📋 Termo de Uso</Text>
            </TouchableOpacity>
            <Text style={styles.footerVersion}>v1.0</Text>
          </View>
          
          <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a7ea4',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: 10,
    borderRadius: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  searchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 2,
    fontWeight: '600',
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#0a7ea4',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#ccc',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIcon: {
    fontSize: 22,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#999',
  },
  menuArrow: {
    fontSize: 20,
    color: '#0a7ea4',
    fontWeight: 'bold',
  },
  tipContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  tipIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  tipTextContainer: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  tipText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  footer: {
    marginTop: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  footerLink: {
    color: '#fff',
    fontSize: 12,
    textDecorationLine: 'underline',
    marginBottom: 4,
  },
  footerVersion: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
  },
  bottomSpace: {
    height: 20,
  },
})