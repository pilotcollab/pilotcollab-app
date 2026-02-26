import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { useAuth } from './AuthContext'

type AeroportoFavorito = {
  icao: string
  nome: string
  cidade: string
  uf: string
  metar?: string
  lastUpdated?: number
}

type FavoritesContextType = {
  favorites: AeroportoFavorito[]
  addFavorite: (aeroporto: AeroportoFavorito) => void
  removeFavorite: (icao: string) => void
  isFavorite: (icao: string) => boolean
  updateMetar: (icao: string, metar: string) => void
  loading: boolean
  refreshFavorites: () => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextType>({} as FavoritesContextType)

export const useFavorites = () => useContext(FavoritesContext)

export const FavoritesProvider = ({ children }: { children: React.ReactNode }) => {
  const [favorites, setFavorites] = useState<AeroportoFavorito[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  console.log('📦 FavoritesContext iniciado')

  // Carregar favoritos quando usuário logar
  useEffect(() => {
    if (user?.id) {
      loadFavorites()
    } else {
      setFavorites([])
      setLoading(false)
    }
  }, [user?.id])

  const loadFavorites = async () => {
    try {
      setLoading(true)
      if (!user?.id) return
      
      const key = `@favorites_${user.id}`
      console.log('📂 Carregando favoritos de:', key)
      
      const saved = await AsyncStorage.getItem(key)
      console.log('📦 Dados carregados:', saved ? 'sim' : 'não')
      
      if (saved) {
        setFavorites(JSON.parse(saved))
      }
    } catch (error) {
      console.error('❌ Erro ao carregar favoritos:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshFavorites = async () => {
    await loadFavorites()
  }

  const saveFavorites = async (newFavorites: AeroportoFavorito[]) => {
    try {
      if (!user?.id) return
      
      const key = `@favorites_${user.id}`
      console.log('💾 Salvando favoritos para:', key, newFavorites.length)
      await AsyncStorage.setItem(key, JSON.stringify(newFavorites))
      setFavorites(newFavorites)
    } catch (error) {
      console.error('❌ Erro ao salvar favoritos:', error)
      Alert.alert('Erro', 'Não foi possível salvar os favoritos')
    }
  }

  const addFavorite = (aeroporto: AeroportoFavorito) => {
    if (!user) {
      Alert.alert('Login necessário', 'Faça login para adicionar favoritos')
      return
    }

    const newFavorites = [...favorites, aeroporto]
    saveFavorites(newFavorites)
  }

  const removeFavorite = (icao: string) => {
    const newFavorites = favorites.filter(f => f.icao !== icao)
    saveFavorites(newFavorites)
  }

  const isFavorite = (icao: string) => {
    return favorites.some(f => f.icao === icao)
  }

  const updateMetar = (icao: string, metar: string) => {
    console.log(`🔄 Atualizando METAR para ${icao}:`, metar.substring(0, 30))
    
    const newFavorites = favorites.map(f => 
      f.icao === icao ? { 
        ...f, 
        metar, 
        lastUpdated: Date.now()
      } : f
    )
    
    saveFavorites(newFavorites)
  }

  return (
    <FavoritesContext.Provider value={{
      favorites,
      addFavorite,
      removeFavorite,
      isFavorite,
      updateMetar,
      loading,
      refreshFavorites
    }}>
      {children}
    </FavoritesContext.Provider>
  )
}