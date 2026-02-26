import { Stack, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, Platform, StatusBar, Text, TouchableOpacity, View } from "react-native"
import { AuthProvider, useAuth } from "../lib/AuthContext"
import { FavoritesProvider } from "../lib/FavoritesContext"
import { supabase } from "../lib/supabase"

function HeaderRight() {
  const router = useRouter()
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      verificarAdmin()
    } else {
      setLoading(false)
    }
  }, [user])

  async function verificarAdmin() {
    try {
      if (!user?.email) return
      
      const { data } = await supabase
        .from('admins')
        .select('*')
        .eq('email', user.email)
        .maybeSingle()
      
      setIsAdmin(!!data)
    } catch (error) {
      console.error('Erro ao verificar admin:', error)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (loading) {
    return (
      <View style={{ marginRight: 15 }}>
        <ActivityIndicator size="small" color="#fff" />
      </View>
    )
  }

  if (user) {
    return (
      <View style={{ flexDirection: 'row', gap: 12, marginRight: 15, alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.push('/perfil' as any)}>
          <Text style={{ color: '#fff', fontSize: 16 }}>👤</Text>
        </TouchableOpacity>
        
        {isAdmin && (
          <TouchableOpacity onPress={() => router.push('/moderacao' as any)}>
            <Text style={{ color: '#fff', fontSize: 16 }}>⚖️</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity onPress={handleLogout}>
          <Text style={{ color: '#fff', fontSize: 16 }}>🚪</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <TouchableOpacity onPress={() => router.push('/login')} style={{ marginRight: 15 }}>
      <Text style={{ color: '#fff', fontSize: 14 }}>🔑 Login</Text>
    </TouchableOpacity>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <View style={{ 
          flex: 1,
          backgroundColor: '#0a7ea4',
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 25 : 0,
        }}>
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: '#0a7ea4',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
            <Stack.Screen 
              name="index" 
              options={{ 
                title: 'Pilot Collab',
                headerRight: () => <HeaderRight />
              }} 
            />
            <Stack.Screen 
              name="login" 
              options={{ 
                title: 'Login',
                headerRight: () => null
              }} 
            />
            <Stack.Screen 
              name="termo-de-uso" 
              options={{ 
                title: 'Termo de Uso',
                headerRight: () => <HeaderRight />
              }} 
            />
            <Stack.Screen 
              name="favorites" 
              options={{ 
                title: 'Favoritos',
                headerRight: () => <HeaderRight />
              }} 
            />
            <Stack.Screen 
              name="moderacao" 
              options={{ 
                title: 'Moderação',
                headerRight: () => <HeaderRight />
              }} 
            />
            <Stack.Screen 
              name="airport/[icao]" 
              options={{ 
                title: 'Aeroporto',
                headerRight: () => <HeaderRight />
              }} 
            />
            <Stack.Screen 
              name="perfil" 
              options={{ 
                title: 'Meu Perfil',
                headerRight: () => <HeaderRight />
              }} 
            />
            <Stack.Screen 
              name="freela" 
              options={{ 
                title: 'Disponibilidade',
                headerRight: () => <HeaderRight />
              }} 
            />
            <Stack.Screen 
              name="busca-freelas" 
              options={{ 
                title: 'Buscar Freelas',
                headerRight: () => <HeaderRight />
              }} 
            />
            <Stack.Screen 
              name="recent-reports" 
              options={{ 
                title: 'Últimos Reportes',
                headerRight: () => <HeaderRight />
              }} 
            />
          </Stack>
        </View>
      </FavoritesProvider>
    </AuthProvider>
  )
}