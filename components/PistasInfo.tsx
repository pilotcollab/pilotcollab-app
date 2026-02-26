import { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { supabase } from '../lib/supabase'

type Pista = {
  id: number
  airport_ident: string
  length_ft: number
  width_ft: number
  surface: string
  lighted: boolean
  le_ident: string
  he_ident: string
}

export default function PistasInfo({ icao }: { icao: string }) {
  const [pistas, setPistas] = useState<Pista[]>([])
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState(true)

  useEffect(() => {
    carregarPistas()
  }, [icao])

  async function carregarPistas() {
    try {
      const { data, error } = await supabase
        .from('runways')
        .select('*')
        .eq('airport_ident', icao.toUpperCase())
        .order('length_ft', { ascending: false })

      if (error) throw error
      setPistas(data || [])
    } catch (error) {
      console.error('Erro ao carregar pistas:', error)
    } finally {
      setLoading(false)
    }
  }

  function getSurfaceIcon(surface: string) {
    const s = surface?.toLowerCase() || ''
    if (s.includes('asp')) return '🛣️'
    if (s.includes('con')) return '🏗️'
    if (s.includes('turf') || s.includes('grass')) return '🌿'
    if (s.includes('gravel')) return '🪨'
    if (s.includes('water')) return '💧'
    return '🛬'
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0a7ea4" />
      </View>
    )
  }

  if (pistas.length === 0) {
    return null
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setExpandido(!expandido)}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>🛣️</Text>
          <Text style={styles.title}>
            Pistas ({pistas.length})
          </Text>
        </View>
        <Text style={styles.expandButton}>{expandido ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {expandido && (
        <FlatList
          data={pistas}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.runwayCard}>
              <View style={styles.runwayHeader}>
                <Text style={styles.runwayIdent}>
                  {item.le_ident}/{item.he_ident}
                </Text>
                {item.lighted && (
                  <View style={styles.lightBadge}>
                    <Text style={styles.lightText}>💡</Text>
                  </View>
                )}
              </View>

              <View style={styles.dimensions}>
                <Text style={styles.dimensionText}>
                  📏 {Math.round(item.length_ft * 0.3048)} m ({item.length_ft} ft)
                </Text>
                <Text style={styles.dimensionText}>
                  📐 {Math.round(item.width_ft * 0.3048)} m ({item.width_ft} ft)
                </Text>
              </View>

              {item.surface && (
                <View style={styles.surface}>
                  <Text style={styles.surfaceIcon}>{getSurfaceIcon(item.surface)}</Text>
                  <Text style={styles.surfaceText}>{item.surface}</Text>
                </View>
              )}
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
  runwayCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginVertical: 4
  },
  runwayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  runwayIdent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a7ea4'
  },
  lightBadge: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  lightText: {
    fontSize: 12
  },
  dimensions: {
    gap: 4,
    marginBottom: 8
  },
  dimensionText: {
    fontSize: 13,
    color: '#333'
  },
  surface: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  surfaceIcon: {
    fontSize: 14
  },
  surfaceText: {
    fontSize: 12,
    color: '#666'
  },
  separator: {
    height: 8
  }
})