import { useState, useEffect } from 'react'
import { Card } from 'konsta/react'
import type { ExchangeRates } from '../hooks/useExchangeRates'

interface Props {
    rates: ExchangeRates
}

type Currency = 'VES' | 'USD' | 'EUR' | 'USDT'

const currencyOptions = [
    { value: 'VES', label: 'Bs', flag: '🇻🇪', name: 'Bolívares' },
    { value: 'USD', label: 'USD', flag: '🇺🇸', name: 'Dólar BCV' },
    { value: 'EUR', label: 'EUR', flag: '🇪🇺', name: 'Euro BCV' },
    { value: 'USDT', label: 'USDT', flag: '💰', name: 'Binance' },
]

export default function CurrencyConverter({ rates }: Props) {
    const [amount, setAmount] = useState<string>('1')
    const [fromCurrency, setFromCurrency] = useState<Currency>('USD')
    const [toCurrency, setToCurrency] = useState<Currency>('VES')
    const [result, setResult] = useState<number>(0)

    useEffect(() => {
        calculateConversion()
    }, [amount, fromCurrency, toCurrency, rates])

    const getRateInVes = (currency: Currency): number => {
        if (currency === 'VES') return 1
        if (currency === 'USD') return rates.bcv?.usd || 0
        if (currency === 'EUR') return rates.bcv?.eur || 0
        if (currency === 'USDT') return rates.usdt?.average || 0
        return 0
    }

    const calculateConversion = () => {
        const numAmount = parseFloat(amount)
        if (isNaN(numAmount) || !rates.bcv || !rates.usdt) return

        const fromRate = getRateInVes(fromCurrency)
        const toRate = getRateInVes(toCurrency)

        if (toRate === 0) return

        const valueInVes = numAmount * fromRate
        const finalValue = valueInVes / toRate

        setResult(finalValue)
    }

    const handleSwap = () => {
        setFromCurrency(toCurrency)
        setToCurrency(fromCurrency)
    }

    const formatResult = (val: number) => {
        return new Intl.NumberFormat('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4
        }).format(val)
    }

    const getSelectedCurrency = (currency: Currency) => {
        return currencyOptions.find(opt => opt.value === currency)
    }

    return (
        <Card className="!m-0 !p-4 !rounded-2xl !shadow-sm bg-white border border-gray-100">
            {/* Amount Input */}
            <div className="mb-3">
                <label className="block text-xs font-medium text-gray-500 mb-2">Monto</label>
                <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 text-2xl font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 focus:bg-white transition-all placeholder:text-gray-300"
                    style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                />
            </div>

            <div className="flex items-end gap-3">
                {/* From Currency */}
                <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">De</label>
                    <select
                        value={fromCurrency}
                        onChange={(e) => setFromCurrency(e.target.value as Currency)}
                        className="w-full px-4 py-3 text-base font-medium text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 transition-all appearance-none cursor-pointer"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23111827'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 1rem center',
                            backgroundSize: '1.25rem',
                            paddingRight: '3rem'
                        }}
                    >
                        {currencyOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.flag} {opt.label} - {opt.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Swap Button */}
                <div className="flex items-center self-stretch">
                    <button
                        type="button"
                        className="w-12 h-12 p-0 flex items-center justify-center rounded-full bg-gray-900 text-white shadow-md focus:outline-none"
                        onClick={handleSwap}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            className="block"
                            aria-hidden="true"
                            focusable="false"
                        >
                            <path
                                d="M7 7h11m0 0-3-3m3 3-3 3M17 17H6m0 0 3 3m-3-3 3-3"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </div>

                {/* To Currency */}
                <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">A</label>
                    <select
                        value={toCurrency}
                        onChange={(e) => setToCurrency(e.target.value as Currency)}
                        className="w-full px-4 py-3 text-base font-medium text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 transition-all appearance-none cursor-pointer"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23111827'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 1rem center',
                            backgroundSize: '1.25rem',
                            paddingRight: '3rem'
                        }}
                    >
                        {currencyOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.flag} {opt.label} - {opt.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Result Display */}
            <div className="pt-4 text-center">
                <div className="text-xs text-gray-500 mb-2">
                    {amount || '0'} {getSelectedCurrency(fromCurrency)?.flag} {fromCurrency} =
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-1">
                    {formatResult(result)}
                </div>
                <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                    {getSelectedCurrency(toCurrency)?.flag} {toCurrency}
                </div>
            </div>
        </Card>
    )
}
