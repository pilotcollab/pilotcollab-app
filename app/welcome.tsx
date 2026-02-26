import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useRef, useState } from "react"
import {
  Alert,
  Animated,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native"

export default function Welcome() {
  const router = useRouter()
  const [termoAceito, setTermoAceito] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
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

  async function aceitarEProseguir() {
    if (!termoAceito) {
      Alert.alert('Atenção', 'Você precisa aceitar o Termo de Uso para continuar')
      return
    }

    try {
      // Marcar que o usuário já viu o termo
      await AsyncStorage.setItem('@termo_aceito', 'true')
      
      // Ir para a tela inicial
      router.replace('/')
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar sua preferência')
    }
  }

  function abrirTermoCompleto() {
    router.push('/termo-de-uso')
  }

  function abrirAISWEB() {
    Linking.openURL('https://aisweb.decea.mil.br')
  }

  function abrirANAC() {
    Linking.openURL('https://www.anac.gov.br')
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
            <Text style={styles.title}>Bem-vindo ao Pilot Collab</Text>
            <Text style={styles.subtitle}>
              Informações colaborativas para pilotos
            </Text>
          </View>

          {/* Aviso Principal */}
          <View style={styles.avisoContainer}>
            <Text style={styles.avisoIcon}>⚠️</Text>
            <Text style={styles.avisoTitulo}>AVISO IMPORTANTE</Text>
            <Text style={styles.avisoTexto}>
              Este é um aplicativo COLABORATIVO. As informações aqui contidas NÃO SUBSTITUEM as fontes oficiais de informação aeronáutica.
            </Text>
          </View>

          {/* Responsabilidade do Piloto */}
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>👨‍✈️ Responsabilidade do Piloto</Text>
            <Text style={styles.cardTexto}>
              O piloto em comando é o único responsável pela segurança do voo e pela verificação de todas as informações necessárias em fontes oficiais.
            </Text>
          </View>

          {/* Fontes Oficiais */}
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>📡 Fontes Oficiais Obrigatórias</Text>
            <Text style={styles.cardTexto}>
              Consulte sempre:
            </Text>
            <TouchableOpacity style={styles.linkButton} onPress={abrirAISWEB}>
              <Text style={styles.linkButtonText}>✈️ AISWEB (DECEA)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkButton} onPress={abrirANAC}>
              <Text style={styles.linkButtonText}>📘 ANAC</Text>
            </TouchableOpacity>
          </View>

          {/* Natureza Colaborativa */}
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>🤝 Natureza Colaborativa</Text>
            <Text style={styles.cardTexto}>
              • Condições de pista são reportadas por usuários{'\n'}
              • Status de combustível é colaborativo{'\n'}
              • Telefones úteis podem ser adicionados por qualquer piloto{'\n'}
              • Sempre verifique a data do último reporte
            </Text>
          </View>

          {/* Isenção de Responsabilidade */}
          <View style={styles.cardDestaque}>
            <Text style={styles.cardDestaqueTitulo}>⚖️ Isenção de Responsabilidade</Text>
            <Text style={styles.cardDestaqueTexto}>
              O Pilot Collab, seus desenvolvedores e colaboradores NÃO SE RESPONSABILIZAM por qualquer dano, prejuízo ou incidente decorrente do uso das informações disponibilizadas no aplicativo.
            </Text>
          </View>

          {/* Aceite do Termo */}
          <View style={styles.termoContainer}>
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setTermoAceito(!termoAceito)}
            >
              <View style={[styles.checkbox, termoAceito && styles.checkboxChecked]}>
                {termoAceito && <Text style={styles.checkboxIcon}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                Li e aceito o
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={abrirTermoCompleto}>
              <Text style={styles.termoLink}>Termo de Uso e Responsabilidade</Text>
            </TouchableOpacity>
          </View>

          {/* Botão Continuar */}
          <TouchableOpacity 
            style={[styles.continueButton, !termoAceito && styles.continueButtonDisabled]} 
            onPress={aceitarEProseguir}
            disabled={!termoAceito}
          >
            <Text style={styles.continueButtonText}>
              {termoAceito ? '✓ Aceitar e Continuar' : 'Aceite o termo para continuar'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>Versão 1.0.0</Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a7ea4',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 15,
    borderRadius: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  avisoContainer: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#ffc107',
    alignItems: 'center',
  },
  avisoIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  avisoTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
    textAlign: 'center',
  },
  avisoTexto: {
    fontSize: 16,
    color: '#856404',
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  cardTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  cardTexto: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  cardDestaque: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fff',
  },
  cardDestaqueTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  cardDestaqueTexto: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  linkButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  linkButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  termoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    borderRadius: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#fff',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#fff',
  },
  checkboxIcon: {
    color: '#0a7ea4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#fff',
  },
  termoLink: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  continueButton: {
    backgroundColor: '#4caf50',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  continueButtonDisabled: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
})