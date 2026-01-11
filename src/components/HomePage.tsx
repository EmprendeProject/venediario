import { Page, Navbar, Block, Card } from 'konsta/react'
import USDTPriceChart from './USDTPriceChart'
import CurrencyConverter from './CurrencyConverter'
import { useExchangeRates } from '../hooks/useExchangeRates'

export default function HomePage() {
  const rates = useExchangeRates()

  const formatPrice = (price: number, decimals: number = 2) => {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimals
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const [year, month, day] = dateString.split('-')
    return `${day}/${month}/${year}`
  }

  return (
    <Page className="bg-[#f5f5f7]">
      <Navbar
        title=""
        className="!bg-transparent border-none"
      />

      <Block className="px-5 pt-2 pb-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Monitor Dólar</h1>
          <p className="text-sm text-gray-500">Tasas en tiempo real</p>
        </div>

        {/* Hero Card - USDT Principal */}
        <Card className="!m-0 !p-6 !rounded-3xl !shadow-lg bg-gradient-to-br from-gray-900 to-gray-800 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">₮</span>
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-400">USDT Binance</div>
              <div className="text-xs text-green-400 font-medium">En tiempo real</div>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-4xl font-bold text-white mb-1">
              {rates.usdt ? formatPrice(rates.usdt.average) : '...'}
            </div>
            <div className="text-sm text-gray-400">VES</div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">Compra</div>
              <div className="text-sm font-semibold text-white">
                {rates.usdt ? formatPrice(rates.usdt.buy) : '...'}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">Venta</div>
              <div className="text-sm font-semibold text-white">
                {rates.usdt ? formatPrice(rates.usdt.sell) : '...'}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">Promedio</div>
              <div className="text-sm font-semibold text-white">
                {rates.usdt ? formatPrice(rates.usdt.average) : '...'}
              </div>
            </div>
          </div>
        </Card>

        {/* Tasas BCV */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Tasas BCV</h2>
            <span className="text-xs text-gray-500">{rates.bcv ? formatDate(rates.bcv.date) : ''}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* USD BCV */}
            <Card className="!m-0 !p-4 !rounded-2xl !shadow-sm bg-white border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">$</span>
                </div>
                <span className="text-xs font-medium text-gray-600">USD</span>
              </div>
              <div className="text-xl font-bold text-gray-900 mb-1">
                {rates.bcv ? formatPrice(rates.bcv.usd) : '...'}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">VES</span>
                {rates.bcv && (
                  <span className={`text-xs font-semibold ml-auto ${rates.bcv.changeUsd >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {rates.bcv.changeUsd >= 0 ? '+' : ''}{rates.bcv.changeUsd.toFixed(2)}%
                  </span>
                )}
              </div>
            </Card>

            {/* EUR BCV */}
            <Card className="!m-0 !p-4 !rounded-2xl !shadow-sm bg-white border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">€</span>
                </div>
                <span className="text-xs font-medium text-gray-600">EUR</span>
              </div>
              <div className="text-xl font-bold text-gray-900 mb-1">
                {rates.bcv ? formatPrice(rates.bcv.eur, 2) : '...'}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">VES</span>
                {rates.bcv && (
                  <span className={`text-xs font-semibold ml-auto ${rates.bcv.changeEur >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {rates.bcv.changeEur >= 0 ? '+' : ''}{rates.bcv.changeEur.toFixed(2)}%
                  </span>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Convertidor */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Convertidor</h2>
          <CurrencyConverter rates={rates} />
        </div>

        {/* Gráfico */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Histórico USDT</h2>
          <Card className="!m-0 !p-4 !rounded-2xl !shadow-sm bg-white border border-gray-100">
            <USDTPriceChart />
          </Card>
        </div>
      </Block>
    </Page>
  )
}
