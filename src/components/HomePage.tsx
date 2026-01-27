import { Page, Navbar, Block, Card } from 'konsta/react'
import USDTPriceChart from './USDTPriceChart'
import CurrencyConverter from './CurrencyConverter'
import { useExchangeRates } from '../hooks/useExchangeRates'
import AddToHomeScreenCTA from './AddToHomeScreenCTA'

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

      <Block className="px-5 pb-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 8px) + 12px)' }}>
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 -mb-1">venediario app</h1>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">{rates.bcv ? formatDate(rates.bcv.date) : ''}</div>
          </div>
        </div>

        {/* Hero Card - USDT Principal */}
        <Card className="!m-0 !p-2 !pt-1 !pb-5 !rounded-3xl !shadow-lg bg-gradient-to-br from-gray-900 to-gray-800 !mb-2">
          <div className="flex items-center gap-1 mb-0.5">
            <div className="w-7 h-7 bg-green-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xs">₮</span>
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-400">USDT Binance</div>
              <div className="text-xs text-green-400 font-medium">En tiempo real</div>
            </div>
          </div>

          <div className="mb-1">
            <div className="text-[34px] font-bold text-white mb-0 leading-none">
              {rates.usdt ? formatPrice(rates.usdt.average) : '...'}
            </div>
            <div className="text-xs text-gray-400">Bs</div>
          </div>

          {/* Tarjetas compactas eliminadas para reducir la altura del Hero */}
        </Card>

        {/* Tasas BCV */}
        <div className="mb-3">
          {/* Fecha movida al header superior */}

          <div className="grid grid-cols-2 gap-1">
            {/* USD BCV (ultra compacta) */}
            <Card className="!m-0 !p-1 !rounded-2xl !shadow-sm bg-white border border-gray-100">
              <div className="flex items-center gap-0.5 mb-0.5">
                <div className="w-5 h-5 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-[10px]">$</span>
                </div>
                <span className="text-xs font-medium text-gray-600">USD</span>
              </div>
              <div className="text-base font-bold text-gray-900 leading-tight mb-0">
                {rates.bcv ? formatPrice(rates.bcv.usd) : '...'}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Bs</span>
                {rates.bcv && (
                  <span className={`text-xs font-semibold ml-auto ${rates.bcv.changeUsd >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {rates.bcv.changeUsd >= 0 ? '+' : ''}{rates.bcv.changeUsd.toFixed(2)}%
                  </span>
                )}
              </div>
            </Card>

            {/* EUR BCV (ultra compacta) */}
            <Card className="!m-0 !p-1 !rounded-2xl !shadow-sm bg-white border border-gray-100">
              <div className="flex items-center gap-0.5 mb-0.5">
                <div className="w-5 h-5 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-[10px]">€</span>
                </div>
                <span className="text-xs font-medium text-gray-600">EUR</span>
              </div>
              <div className="text-base font-bold text-gray-900 leading-tight mb-0">
                {rates.bcv ? formatPrice(rates.bcv.eur, 2) : '...'}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Bs</span>
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
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Calculadora</h2>
          <CurrencyConverter rates={rates} />
        </div>

        {/* Gráfico */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Grafico USDT Binance</h2>
          <Card className="!m-0 !p-4 !rounded-2xl !shadow-sm bg-white border border-gray-100">
            <USDTPriceChart />
          </Card>
        </div>

        {/* CTA al final */}
        <AddToHomeScreenCTA />
      </Block>
    </Page>
  )
}
