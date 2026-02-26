import { useState } from 'react'
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

type Props = {
  reportId: number
  reportado_por: string
  onDenunciaEnviada: () => void
  visible: boolean
  onClose: () => void
}

export default function ReportDenuncia({ 
  reportId, 
  reportado_por, 
  onDenunciaEnviada,
  visible,
  onClose 
}: Props) {
  const { user } = useAuth()
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)

  const motivos = [
    'Informação falsa',
    'Conteúdo impróprio',
    'Spam',
    'Outro'
  ]

  async function enviarDenuncia() {
    if (!user) {
      Alert.alert('Login necessário', 'Faça login para denunciar')
      return
    }

    if (!motivo) {
      Alert.alert('Atenção', 'Selecione um motivo')
      return
    }

    setLoading(true)

    try {
      // Buscar report atual
      const { data: report, error: fetchError } = await supabase
        .from('reports')
        .select('denuncias, denunciado_por')
        .eq('id', reportId)
        .single()

      if (fetchError) throw fetchError

      // Verificar se usuário já denunciou
      if (report.denunciado_por?.includes(user.email)) {
        Alert.alert('Atenção', 'Você já denunciou este reporte')
        return
      }

      // Atualizar contagem de denúncias
      const { error: updateError } = await supabase
        .from('reports')
        .update({
          denuncias: (report.denuncias || 0) + 1,
          denunciado_por: [...(report.denunciado_por || []), user.email]
        })
        .eq('id', reportId)

      if (updateError) throw updateError

      // Se atingiu 3 denúncias, marcar para revisão
      if ((report.denuncias || 0) + 1 >= 3) {
        Alert.alert(
          'Reporte sinalizado', 
          'Este reporte foi sinalizado e será revisado pela moderação.'
        )
      } else {
        Alert.alert('Denúncia enviada', 'Obrigado por ajudar a manter a qualidade')
      }

      setMotivo('')
      onDenunciaEnviada()
      onClose()

    } catch (error: any) {
      Alert.alert('Erro', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Denunciar Reporte</Text>
          <Text style={styles.modalSubtitle}>
            Reportado por: {reportado_por}
          </Text>

          <Text style={styles.label}>Motivo da denúncia:</Text>
          {motivos.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.motivoButton,
                motivo === item && styles.motivoButtonSelected
              ]}
              onPress={() => setMotivo(item)}
            >
              <Text style={[
                styles.motivoText,
                motivo === item && styles.motivoTextSelected
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.denunciaButton, loading && styles.buttonDisabled]} 
              onPress={enviarDenuncia}
              disabled={loading}
            >
              <Text style={styles.denunciaButtonText}>
                {loading ? 'Enviando...' : 'Denunciar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
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
    width: '90%',
    maxWidth: 400
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a7ea4',
    marginBottom: 5
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    fontWeight: '500'
  },
  motivoButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5'
  },
  motivoButtonSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#0a7ea4'
  },
  motivoText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center'
  },
  motivoTextSelected: {
    color: '#0a7ea4',
    fontWeight: 'bold'
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500'
  },
  denunciaButton: {
    flex: 1,
    backgroundColor: '#f44336',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  denunciaButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  buttonDisabled: {
    opacity: 0.5
  }
})