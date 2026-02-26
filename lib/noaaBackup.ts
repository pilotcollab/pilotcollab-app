import { supabase } from './supabase';

/**
 * Serviço de backup METAR/TAF usando a API gratuita da NOAA
 * Documentação: https://aviationweather.gov/data/api/
 */

// Cache simples para evitar chamadas repetidas
const cache: Record<string, { data: any; timestamp: number }> = {}
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutos

// Headers para evitar bloqueios
const HEADERS = {
  'User-Agent': 'PilotCollab/1.0 (contato@pilotcollab.com)',
  Accept: 'application/json',
}

export type MetarResult = {
  metar: string
  taf: string
  source: 'aisweb' | 'noaa' | 'none'
  warning?: string
}

/**
 * Busca METAR da NOAA
 */
async function fetchNoaaMetar(icao: string): Promise<string | null> {
  try {
    const url = `https://aviationweather.gov/api/data/metar?ids=${icao}&format=json`
    console.log(`🌐 NOAA METAR: ${url}`)

    const response = await fetch(url, { headers: HEADERS })

    if (!response.ok) {
      console.log(`❌ NOAA METAR erro ${response.status}`)
      return null
    }

    const data = await response.json()

    if (data && data.length > 0 && data[0].rawOb) {
      console.log(`✅ NOAA METAR encontrado para ${icao}`)
      return data[0].rawOb
    }

    return null
  } catch (error) {
    console.log('❌ NOAA METAR exception:', error)
    return null
  }
}

/**
 * Busca TAF da NOAA
 */
async function fetchNoaaTaf(icao: string): Promise<string | null> {
  try {
    const url = `https://aviationweather.gov/api/data/taf?ids=${icao}&format=json`
    console.log(`🌐 NOAA TAF: ${url}`)

    const response = await fetch(url, { headers: HEADERS })

    if (!response.ok) {
      console.log(`❌ NOAA TAF erro ${response.status}`)
      return null
    }

    const data = await response.json()

    if (data && data.length > 0 && data[0].rawTAF) {
      console.log(`✅ NOAA TAF encontrado para ${icao}`)
      return data[0].rawTAF
    }

    return null
  } catch (error) {
    console.log('❌ NOAA TAF exception:', error)
    return null
  }
}

/**
 * Função principal com fallback em cascata:
 * 1. Tenta AISWEB
 * 2. Se falhar, tenta NOAA
 * 3. Se ambos falharem, retorna mensagens amigáveis
 */
export async function buscarMetarComFallback(icao: string): Promise<MetarResult> {
  console.log(`🔍 Buscando METAR/TAF para ${icao}...`)

  // Verificar cache
  const cached = cache[icao]
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`📦 Usando cache para ${icao}`)
    return cached.data
  }

  // 1️⃣ TENTAR AISWEB
  try {
    console.log('1️⃣ Tentando AISWEB...')
    const { data, error } = await supabase.functions.invoke('aisweb-proxy', {
      body: { icao, area: 'met' },
    })

    if (!error && data?.metar && data.metar !== 'Sem METAR disponível') {
      console.log('✅ AISWEB funcionou!')
      const result = {
        metar: data.metar,
        taf: data.taf || 'TAF não disponível',
        source: 'aisweb' as const,
      }
      cache[icao] = { data: result, timestamp: Date.now() }
      return result
    }
  } catch (error) {
    console.log('❌ AISWEB falhou:', error)
  }

  // 2️⃣ TENTAR NOAA
  try {
    console.log('2️⃣ Tentando NOAA...')

    const [metar, taf] = await Promise.all([
      fetchNoaaMetar(icao),
      fetchNoaaTaf(icao)
    ])

    if (metar || taf) {
      console.log('✅ NOAA funcionou!')
      const result = {
        metar: metar || 'METAR não disponível para este aeroporto',
        taf: taf || 'TAF não disponível para este aeroporto',
        source: 'noaa' as const,
        warning: 'Usando dados da NOAA (fonte alternativa)',
      }
      cache[icao] = { data: result, timestamp: Date.now() }
      return result
    }
  } catch (error) {
    console.log('❌ NOAA falhou:', error)
  }

  // 3️⃣ AMBOS FALHARAM
  console.log(`⚠️ Nenhuma fonte retornou METAR/TAF para ${icao}`)
  
  const result = {
    metar: 'METAR não disponível',
    taf: 'TAF não disponível',
    source: 'none' as const,
    warning: 'Informação meteorológica não disponível no momento'
  }
  
  cache[icao] = { data: result, timestamp: Date.now() }
  
  return result
}