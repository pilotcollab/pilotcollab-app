import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import {
    Linking,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native"

export default function TermoDeUso() {
  const router = useRouter()
  const dataAtual = new Date().toLocaleDateString('pt-BR')

  const abrirAISWEB = () => {
    Linking.openURL('https://aisweb.decea.mil.br')
  }

  const abrirANAC = () => {
    Linking.openURL('https://www.anac.gov.br')
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📋 Termo de Uso</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Aviso Principal */}
        <View style={styles.avisoContainer}>
          <Text style={styles.avisoIcon}>⚠️</Text>
          <Text style={styles.avisoTitulo}>AVISO IMPORTANTE</Text>
          <Text style={styles.avisoTexto}>
            O Pilot Collab é uma ferramenta COLABORATIVA e NÃO SUBSTITUI as fontes oficiais de informação aeronáutica.
          </Text>
        </View>

        {/* Seção 1: Natureza do App */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>1. Natureza Colaborativa</Text>
          <Text style={styles.secaoTexto}>
            O Pilot Collab é um aplicativo desenvolvido por pilotos para pilotos, com o objetivo de 
            facilitar o compartilhamento de informações entre a comunidade aeronáutica. Todas as 
            informações publicadas no app são fornecidas por usuários colaboradores e NÃO POSSUEM 
            CARÁTER OFICIAL.
          </Text>
        </View>

        {/* Seção 2: Fontes Oficiais */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>2. Fontes Oficiais Obrigatórias</Text>
          <Text style={styles.secaoTexto}>
            Para segurança do voo, TODO PILOTO DEVE consultar obrigatoriamente as fontes oficiais:
          </Text>
          
          <TouchableOpacity style={styles.linkButton} onPress={abrirAISWEB}>
            <Text style={styles.linkButtonText}>✈️ AISWEB (DECEA)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.linkButton} onPress={abrirANAC}>
            <Text style={styles.linkButtonText}>📘 ANAC</Text>
          </TouchableOpacity>
        </View>

        {/* Seção 3: METAR/TAF */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>3. METAR, TAF e NOTAMs</Text>
          <Text style={styles.secaoTexto}>
            As informações meteorológicas (METAR/TAF) e NOTAMs são obtidas diretamente da API oficial do 
            DECEA/AISWEB, porém podem sofrer atrasos ou inconsistências. Sempre verifique nos canais 
            oficiais antes de qualquer decisão operacional.
          </Text>
        </View>

        {/* Seção 4: Reportes Colaborativos */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>4. Reportes de Pista e Combustível</Text>
          <Text style={styles.secaoTexto}>
            As condições de pista e disponibilidade de combustível são reportadas por usuários da 
            comunidade e podem estar desatualizadas, incorretas ou incompletas. NUNCA BASEIE SUA 
            DECISÃO DE VOO EXCLUSIVAMENTE NESTAS INFORMAÇÕES.
          </Text>
        </View>

        {/* Seção 5: Responsabilidade */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>5. Responsabilidade do Piloto</Text>
          <Text style={styles.secaoTexto}>
            O piloto em comando é o único responsável pela segurança do voo e pela verificação de 
            todas as informações necessárias, conforme previsto no Código Brasileiro de Aeronáutica 
            e regulamentos da ANAC. O uso do Pilot Collab não exime o piloto desta responsabilidade.
          </Text>
        </View>

        {/* Seção 6: Moderação */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>6. Moderação e Denúncias</Text>
          <Text style={styles.secaoTexto}>
            Para manter a qualidade das informações, contamos com a colaboração de todos. Informações 
            incorretas ou desatualizadas podem ser denunciadas através do botão ⚠️ presente em cada 
            item. Administradores analisarão as denúncias e poderão remover conteúdos inadequados.
          </Text>
        </View>

        {/* Seção 7: Conta do Usuário */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>7. Conta do Usuário</Text>
          <Text style={styles.secaoTexto}>
            Ao criar uma conta, você concorda em fornecer informações verdadeiras e é responsável 
            por todas as atividades realizadas com ela. Contas utilizadas para disseminar informações 
            falsas poderão ser suspensas ou banidas.
          </Text>
        </View>

        {/* Seção 8: Isenção de Responsabilidade */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>8. Isenção de Responsabilidade</Text>
          <Text style={styles.secaoTexto}>
            O Pilot Collab, seus desenvolvedores e colaboradores NÃO SE RESPONSABILIZAM por qualquer 
            dano, prejuízo ou incidente decorrente do uso das informações disponibilizadas no aplicativo. 
            O uso do app é de inteira responsabilidade do usuário.
          </Text>
        </View>

        {/* Seção 9: Alterações */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>9. Alterações no Termo</Text>
          <Text style={styles.secaoTexto}>
            Este termo pode ser alterado a qualquer momento para refletir mudanças no app ou na 
            legislação. O uso continuado do Pilot Collab após alterações implica na aceitação dos 
            novos termos.
          </Text>
        </View>

        {/* Data e Aceitação */}
        <View style={styles.rodape}>
          <Text style={styles.dataTexto}>Versão atual: {dataAtual}</Text>
          <Text style={styles.aceiteTexto}>
            Ao continuar usando o Pilot Collab, você declara ter lido, compreendido e aceito todos 
            os termos acima.
          </Text>
        </View>

        {/* Botão Voltar */}
        <TouchableOpacity 
          style={styles.voltarButton}
          onPress={() => router.back()}
        >
          <Text style={styles.voltarButtonText}>✓ Entendi e Concordo</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: '#0a7ea4',
    padding: 16,
    paddingTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4
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
  content: {
    flex: 1
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40
  },
  avisoContainer: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffc107',
    alignItems: 'center'
  },
  avisoIcon: {
    fontSize: 40,
    marginBottom: 8
  },
  avisoTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
    textAlign: 'center'
  },
  avisoTexto: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    lineHeight: 20
  },
  secao: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  secaoTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a7ea4',
    marginBottom: 8
  },
  secaoTexto: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20
  },
  linkButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center'
  },
  linkButtonText: {
    fontSize: 14,
    color: '#0a7ea4',
    fontWeight: '600'
  },
  rodape: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center'
  },
  dataTexto: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8
  },
  aceiteTexto: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 20
  },
  voltarButton: {
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  voltarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
})