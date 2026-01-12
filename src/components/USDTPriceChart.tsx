import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
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

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-semibold text-gray-900">{formatPrice(entry.value)}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
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
              <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="text-[10px] text-green-700 font-semibold mb-1">Compra</div>
                <div className="text-sm font-bold text-green-900">{formatPrice(currentPrice.buy)}</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                <div className="text-[10px] text-orange-700 font-semibold mb-1">Venta</div>
                <div className="text-sm font-bold text-orange-900">{formatPrice(currentPrice.sell)}</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700">
                <div className="text-[10px] text-gray-300 font-semibold mb-1">Promedio</div>
                <div className="text-sm font-bold text-white">{formatPrice(currentPrice.average)}</div>
              </div>
            </Block>
          )}

          {priceData.length > 0 ? (
            <div className="m-0 bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 border border-gray-100">
              <div style={{ width: '100%', height: windowWidth < 480 ? 300 : 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={priceData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 50 }}
                  >
                    <defs>
                      {/* Gradiente principal más pronunciado - de oscuro arriba a transparente abajo */}
                      <linearGradient id="colorAverage" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#111827" stopOpacity={0.5} />
                        <stop offset="50%" stopColor="#111827" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#111827" stopOpacity={0} />
                      </linearGradient>
                      {/* Gradiente verde para compra */}
                      <linearGradient id="colorBuy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="50%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      {/* Gradiente naranja para venta */}
                      <linearGradient id="colorSell" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.4} />
                        <stop offset="50%" stopColor="#f97316" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      opacity={0.3}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="time"
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      stroke="#9ca3af"
                      fontSize={10}
                      tick={{ fill: '#6b7280' }}
                      tickLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis
                      domain={getYAxisDomain()}
                      tickFormatter={(value) => formatPrice(value)}
                      width={windowWidth < 480 ? 60 : 75}
                      stroke="#9ca3af"
                      fontSize={windowWidth < 480 ? 9 : 10}
                      tick={{ fill: '#6b7280' }}
                      tickLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip content={<CustomTooltip />} />

                    {/* Area principal con gradiente pronunciado */}
                    <Area
                      type="monotone"
                      dataKey="averagePrice"
                      stroke="#111827"
                      strokeWidth={3}
                      fill="url(#colorAverage)"
                      name="Promedio"
                      dot={false}
                      activeDot={{
                        r: 6,
                        fill: '#111827',
                        stroke: '#fff',
                        strokeWidth: 2
                      }}
                      animationDuration={800}
                      animationEasing="ease-in-out"
                    />

                    {/* Líneas secundarias - solo gradiente sin borde */}
                    <Area
                      type="monotone"
                      dataKey="buyPrice"
                      stroke="none"
                      strokeWidth={0}
                      fill="url(#colorBuy)"
                      name="Compra"
                      dot={false}
                      activeDot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                      animationDuration={800}
                      animationEasing="ease-in-out"
                    />
                    <Area
                      type="monotone"
                      dataKey="sellPrice"
                      stroke="none"
                      strokeWidth={0}
                      fill="url(#colorSell)"
                      name="Venta"
                      dot={false}
                      activeDot={{ r: 4, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
                      animationDuration={800}
                      animationEasing="ease-in-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Leyenda personalizada */}
              <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
                  <span className="text-xs text-gray-600 font-medium">Promedio</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600 font-medium">Compra</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-orange-500 rounded-full"></div>
                  <span className="text-xs text-gray-600 font-medium">Venta</span>
                </div>
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
