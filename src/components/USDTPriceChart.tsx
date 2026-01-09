import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import '../App.css'

interface PriceData {
  time: string
  timestamp: number
  averagePrice: number
  buyPrice?: number
  sellPrice?: number
}

interface ApiResponse {
  ask?: number
  bid?: number
  totalAsk?: number
  totalBid?: number
  time?: number
}

const STORAGE_KEY = 'usdt_price_history'
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000 // 30 días en milisegundos

// Función para cargar datos del localStorage
const loadStoredData = (): PriceData[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data: PriceData[] = JSON.parse(stored)
      const now = Date.now()
      // Filtrar solo datos del último mes
      return data.filter(item => (now - item.timestamp) <= ONE_MONTH_MS)
    }
  } catch (error) {
    console.error('Error loading stored data:', error)
  }
  return []
}

// Función para guardar datos en localStorage
const saveData = (data: PriceData[]) => {
  try {
    const now = Date.now()
    // Filtrar solo datos del último mes antes de guardar
    const filteredData = data.filter(item => (now - item.timestamp) <= ONE_MONTH_MS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredData))
  } catch (error) {
    console.error('Error saving data:', error)
  }
}

export default function USDTPriceChart() {
  const [priceData, setPriceData] = useState<PriceData[]>(() => loadStoredData())
  const [currentPrice, setCurrentPrice] = useState<{ buy: number; sell: number; average: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchPriceData = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch('https://criptoya.com/api/binancep2p/usdt/ves')
      const data: ApiResponse = await response.json()
      
      if (data.ask && data.bid) {
        const averagePrice = (data.ask + data.bid) / 2
        const now = new Date()
        const timestamp = now.getTime()
        // Formato de tiempo: fecha y hora para mejor visualización histórica
        const timeString = now.toLocaleString('es-VE', { 
          month: 'short',
          day: 'numeric',
          hour: '2-digit', 
          minute: '2-digit'
        })
        
        setCurrentPrice({
          buy: data.ask,
          sell: data.bid,
          average: averagePrice
        })

        setPriceData(prev => {
          // Filtrar datos antiguos (más de un mes)
          const nowMs = Date.now()
          const recentData = prev.filter(item => (nowMs - item.timestamp) <= ONE_MONTH_MS)
          
          // Crear nuevo punto de datos
          const newDataPoint: PriceData = {
            time: timeString,
            timestamp: timestamp,
            averagePrice: averagePrice,
            buyPrice: data.ask,
            sellPrice: data.bid
          }
          
          // Agregar nuevo dato y evitar duplicados (mismo timestamp)
          const updatedData = [...recentData]
          const lastItem = updatedData[updatedData.length - 1]
          
          // Solo agregar si es un nuevo timestamp o han pasado al menos 5 segundos
          if (!lastItem || (timestamp - lastItem.timestamp) >= 5000) {
            updatedData.push(newDataPoint)
          }
          
          // Guardar en localStorage
          saveData(updatedData)
          
          return updatedData
        })
        
        setLastUpdate(now)
      }
    } catch (error) {
      console.error('Error fetching price data:', error)
    } finally {
      setIsLoading(false)
      setIsUpdating(false)
    }
  }

  useEffect(() => {
    // Cargar datos guardados al iniciar
    const storedData = loadStoredData()
    if (storedData.length > 0) {
      setPriceData(storedData)
      // Establecer el último precio basado en el último dato guardado
      const lastData = storedData[storedData.length - 1]
      if (lastData) {
        setCurrentPrice({
          buy: lastData.buyPrice || 0,
          sell: lastData.sellPrice || 0,
          average: lastData.averagePrice
        })
        setLastUpdate(new Date(lastData.timestamp))
      }
      setIsLoading(false)
    }
    
    // Obtener datos iniciales
    fetchPriceData()
    
    // Actualizar cada 10 segundos para capturar más variaciones
    const interval = setInterval(fetchPriceData, 10000)
    
    // Limpiar datos antiguos cada hora
    const cleanupInterval = setInterval(() => {
      setPriceData(prev => {
        const nowMs = Date.now()
        const filtered = prev.filter(item => (nowMs - item.timestamp) <= ONE_MONTH_MS)
        saveData(filtered)
        return filtered
      })
    }, 60 * 60 * 1000) // Cada hora
    
    return () => {
      clearInterval(interval)
      clearInterval(cleanupInterval)
    }
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
  }

  // Calcular dominio dinámico para el eje Y basado en los datos
  const getYAxisDomain = () => {
    if (priceData.length === 0) return ['auto', 'auto']
    
    const prices = priceData.map(d => d.averagePrice)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const range = maxPrice - minPrice
    
    // Si el rango es muy pequeño, usar un porcentaje del precio promedio
    // Si el rango es grande, usar un pequeño margen porcentual
    const margin = range > 0 ? Math.max(range * 0.1, (minPrice + maxPrice) / 2 * 0.01) : (minPrice * 0.01)
    
    return [minPrice - margin, maxPrice + margin]
  }

  const formatLastUpdate = (date: Date) => {
    return date.toLocaleTimeString('es-VE', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
  }

  return (
    <div className="app-container">
      <div className="header-section">
        <div className="update-indicator">
          {isUpdating && <span className="updating-dot"></span>}
          <span className="update-text">
            {isUpdating ? 'Actualizando...' : 'Actualización automática cada 10 segundos'}
          </span>
          {lastUpdate && (
            <span className="last-update">
              Última actualización: {formatLastUpdate(lastUpdate)}
            </span>
          )}
        </div>
      </div>
      
      {isLoading && priceData.length === 0 ? (
        <div className="loading">Cargando datos...</div>
      ) : (
        <>
          {currentPrice && (
            <div className="current-price">
              <div className="price-card">
                <span className="price-label">Compra:</span>
                <span className="price-value buy">{formatPrice(currentPrice.buy)} VES</span>
              </div>
              <div className="price-card">
                <span className="price-label">Venta:</span>
                <span className="price-value sell">{formatPrice(currentPrice.sell)} VES</span>
              </div>
              <div className="price-card highlight">
                <span className="price-label">Promedio:</span>
                <span className="price-value average">{formatPrice(currentPrice.average)} VES</span>
              </div>
            </div>
          )}

          {priceData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={450}>
                <LineChart data={priceData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" opacity={0.5} />
                  <XAxis 
                    dataKey="time" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    stroke="#757575"
                    fontSize={12}
                    tick={{ fill: '#757575' }}
                  />
                  <YAxis 
                    domain={getYAxisDomain()}
                    tickFormatter={(value) => formatPrice(value)}
                    width={100}
                    stroke="#757575"
                    fontSize={12}
                    tick={{ fill: '#757575' }}
                  />
                  <Tooltip 
                    formatter={(value: number | undefined) => value ? formatPrice(value) : ''}
                    labelStyle={{ 
                      color: '#212121', 
                      fontWeight: 500,
                      marginBottom: '8px'
                    }}
                    contentStyle={{ 
                      backgroundColor: '#ffffff',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      padding: '12px'
                    }}
                    itemStyle={{ 
                      color: '#212121',
                      padding: '4px 0'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      paddingTop: '20px',
                      fontSize: '14px'
                    }}
                    iconType="line"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="averagePrice" 
                    stroke="#1976d2" 
                    strokeWidth={3}
                    name="Precio Promedio"
                    dot={false}
                    activeDot={{ r: 6, fill: '#1976d2' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="buyPrice" 
                    stroke="#2e7d32" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Precio Compra"
                    dot={false}
                    activeDot={{ r: 5, fill: '#2e7d32' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sellPrice" 
                    stroke="#ed6c02" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Precio Venta"
                    dot={false}
                    activeDot={{ r: 5, fill: '#ed6c02' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="no-data">No hay datos disponibles aún. Esperando actualización...</div>
          )}
        </>
      )}
    </div>
  )
}

