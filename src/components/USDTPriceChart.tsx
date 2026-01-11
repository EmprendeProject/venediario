import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Block, Preloader } from 'konsta/react'

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
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000

const loadStoredData = (): PriceData[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data: PriceData[] = JSON.parse(stored)
      const now = Date.now()
      return data.filter(item => (now - item.timestamp) <= ONE_MONTH_MS)
    }
  } catch (error) {
    console.error('Error loading stored data:', error)
  }
  return []
}

const saveData = (data: PriceData[]) => {
  try {
    const now = Date.now()
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
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchPriceData = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch('https://criptoya.com/api/binancep2p/usdt/ves')
      const data: ApiResponse = await response.json()

      if (data.ask && data.bid) {
        const averagePrice = (data.ask + data.bid) / 2
        const now = new Date()
        const timestamp = now.getTime()
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
          const nowMs = Date.now()
          const recentData = prev.filter(item => (nowMs - item.timestamp) <= ONE_MONTH_MS)

          const newDataPoint: PriceData = {
            time: timeString,
            timestamp: timestamp,
            averagePrice: averagePrice,
            buyPrice: data.ask,
            sellPrice: data.bid
          }

          const updatedData = [...recentData]
          const lastItem = updatedData[updatedData.length - 1]

          if (!lastItem || (timestamp - lastItem.timestamp) >= 5000) {
            updatedData.push(newDataPoint)
          }

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
    const storedData = loadStoredData()
    if (storedData.length > 0) {
      setPriceData(storedData)
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

    fetchPriceData()
    const interval = setInterval(fetchPriceData, 10000)
    const cleanupInterval = setInterval(() => {
      setPriceData(prev => {
        const nowMs = Date.now()
        const filtered = prev.filter(item => (nowMs - item.timestamp) <= ONE_MONTH_MS)
        saveData(filtered)
        return filtered
      })
    }, 60 * 60 * 1000)

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

  const getYAxisDomain = () => {
    if (priceData.length === 0) return ['auto', 'auto']

    const prices = priceData.map(d => d.averagePrice)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const range = maxPrice - minPrice
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
    <>
      <Block className="flex justify-between items-center text-xs mb-4 !p-0">
        <div className="flex items-center gap-2">
          {isUpdating && <Preloader className="w-3 h-3" />}
          <span className="text-gray-500 font-medium">
            {isUpdating ? 'Actualizando...' : 'Actualización: 10s'}
          </span>
        </div>
        {lastUpdate && (
          <span className="text-gray-400">{formatLastUpdate(lastUpdate)}</span>
        )}
      </Block>

      {isLoading && priceData.length === 0 ? (
        <Block className="text-center py-12 !p-0">
          <Preloader />
          <div className="mt-3 text-sm text-gray-500">Cargando datos...</div>
        </Block>
      ) : (
        <>
          {currentPrice && (
            <Block className="grid grid-cols-3 gap-2 mb-4 !p-0">
              <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-[10px] text-gray-500 font-medium mb-1">Compra</div>
                <div className="text-sm font-bold text-gray-900">{formatPrice(currentPrice.buy)}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-[10px] text-gray-500 font-medium mb-1">Venta</div>
                <div className="text-sm font-bold text-gray-900">{formatPrice(currentPrice.sell)}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-[10px] text-gray-500 font-medium mb-1">Promedio</div>
                <div className="text-sm font-bold text-gray-900">{formatPrice(currentPrice.average)}</div>
              </div>
            </Block>
          )}

          {priceData.length > 0 ? (
            <div className="!p-0 !m-0 -mx-2">
              <div style={{ width: '100%', height: windowWidth < 480 ? 280 : 380 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceData} margin={{ top: 10, right: 10, left: -10, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis
                      dataKey="time"
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      stroke="#9ca3af"
                      fontSize={10}
                      tick={{ fill: '#6b7280' }}
                    />
                    <YAxis
                      domain={getYAxisDomain()}
                      tickFormatter={(value) => formatPrice(value)}
                      width={windowWidth < 480 ? 55 : 75}
                      stroke="#9ca3af"
                      fontSize={windowWidth < 480 ? 9 : 10}
                      tick={{ fill: '#6b7280' }}
                    />
                    <Tooltip
                      formatter={(value: number | undefined) => value ? formatPrice(value) : ''}
                      labelStyle={{
                        color: '#111827',
                        fontWeight: 600,
                        marginBottom: '6px',
                        fontSize: '12px'
                      }}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        padding: '10px'
                      }}
                      itemStyle={{
                        color: '#374151',
                        padding: '3px 0',
                        fontSize: '12px'
                      }}
                    />
                    <Legend
                      wrapperStyle={{
                        paddingTop: '15px',
                        fontSize: '11px'
                      }}
                      iconType="line"
                    />
                    <Line
                      type="monotone"
                      dataKey="averagePrice"
                      stroke="#111827"
                      strokeWidth={2.5}
                      name="Promedio"
                      dot={false}
                      activeDot={{ r: 5, fill: '#111827' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="buyPrice"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      name="Compra"
                      dot={false}
                      activeDot={{ r: 4, fill: '#10b981' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sellPrice"
                      stroke="#f97316"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      name="Venta"
                      dot={false}
                      activeDot={{ r: 4, fill: '#f97316' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <Block className="text-center py-8 text-gray-500 text-sm !p-0">
              No hay datos disponibles aún. Esperando actualización...
            </Block>
          )}
        </>
      )}
    </>
  )
}
