import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

export function useAdmin() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      setLoading(false)
      return
    }

    verificarAdmin()
  }, [user])

  async function verificarAdmin() {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', user?.email)
        .single()

      setIsAdmin(!!data)
    } catch (error) {
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  return { isAdmin, loading }
}