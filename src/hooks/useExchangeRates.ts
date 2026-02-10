import { useState, useEffect } from 'react'

export interface ExchangeRates {
    bcv: {
        usd: number
        eur: number
        date: string
        changeUsd: number
        changeEur: number
    } | null
    usdt: {
        buy: number
        sell: number
        average: number
        timestamp: number
    } | null
    loading: boolean
    error: string | null
}

export const useExchangeRates = () => {
    const [rates, setRates] = useState<ExchangeRates>({
        bcv: null,
        usdt: null,
        loading: true,
        error: null
    })

    const fetchRates = async () => {
        const newRates: Partial<ExchangeRates> = { loading: false, error: null }

        // 1. Fetch USDT Rates (Independent fetch)
        try {
            const usdtResponse = await fetch('https://criptoya.com/api/binancep2p/usdt/ves')
            if (usdtResponse.ok) {
                const usdtData = await usdtResponse.json()
                newRates.usdt = {
                    buy: usdtData.ask,
                    sell: usdtData.bid,
                    average: (usdtData.ask + usdtData.bid) / 2,
                    timestamp: usdtData.time || Date.now() / 1000
                }
            } else {
                console.error('USDT API Error:', usdtResponse.status)
            }
        } catch (err) {
            console.error('Error fetching USDT rates:', err)
        }

        // 2. Fetch BCV Rates (Independent fetch)
        try {
            // Fetch USD rate from new BCV API (proxied through Vite to avoid CORS)
            const bcvUsdResponse = await fetch('/api/bcv/usd')
            // Fetch EUR rate from new BCV API (proxied through Vite to avoid CORS)
            const bcvEurResponse = await fetch('/api/bcv/eur')

            if (bcvUsdResponse.ok && bcvEurResponse.ok) {
                const bcvUsdData = await bcvUsdResponse.json()
                const bcvEurData = await bcvEurResponse.json()

                newRates.bcv = {
                    usd: bcvUsdData.rate,
                    eur: bcvEurData.rate,
                    date: new Date().toISOString(),
                    changeUsd: 0, // Not available in this API
                    changeEur: 0  // Not available in this API
                }
            } else {
                console.error('BCV API Error:', bcvUsdResponse.status, bcvEurResponse.status)
                // If this fails, we just don't set bcv, so it remains null (or previous value)
            }
        } catch (err) {
            console.error('Error fetching BCV rates:', err)
        }

        setRates(prev => ({
            ...prev,
            ...newRates,
            // Keep previous data if new fetch failed for that specific part
            bcv: newRates.bcv || prev.bcv,
            usdt: newRates.usdt || prev.usdt
        }))
    }

    useEffect(() => {
        fetchRates()
        const interval = setInterval(fetchRates, 60000) // Update every minute
        return () => clearInterval(interval)
    }, [])

    return rates
}
