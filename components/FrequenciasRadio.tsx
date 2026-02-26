import { useState } from 'react'
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'

type Frequencia = {
  tipo: string
  callsign: string
  frequencia: string
  display: string
}

type Props = {
  frequencias: Frequencia[]
}

export default function FrequenciasRadio({ frequencias }: Props) {
  const [expandido, setExpandido] = useState(true)

  console.log("📻 Componente FrequenciasRadio renderizado")
  console.log("📻 Frequencias recebidas:", frequencias?.length || 0)

  if (!frequencias || frequencias.length === 0) {
    console.log("📻 Nenhuma frequência para mostrar")
    return null
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header} 
        onPress={() => setExpandido(!expandido)}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>📻</Text>
          <Text style={styles.title}>Frequências de Rádio ({frequencias.length})</Text>
        </View>
        <Text style={styles.expandButton}>{expandido ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {expandido && (
        <FlatList
          data={frequencias}
          keyExtractor={(item, index) => index.toString()}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.freqItem}>
              <Text style={styles.freqTipo}>{item.tipo}</Text>
              <Text style={styles.freqValor}>{item.frequencia} MHz</Text>
              {item.callsign ? (
                <Text style={styles.freqCallsign}>{item.callsign}</Text>
              ) : null}
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerIcon: {
    fontSize: 18
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
  freqItem: {
    paddingVertical: 10
  },
  freqTipo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  freqValor: {
    fontSize: 16,
    color: '#0a7ea4',
    fontWeight: '500',
    marginTop: 2
  },
  freqCallsign: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0'
  }
})