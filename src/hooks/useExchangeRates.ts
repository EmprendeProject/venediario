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
        try {
            // Fetch BCV Rates
            const bcvResponse = await fetch('https://api.dolarvzla.com/public/exchange-rate')
            const bcvData = await bcvResponse.json()

            // Fetch USDT Rates
            const usdtResponse = await fetch('https://criptoya.com/api/binancep2p/usdt/ves')
            const usdtData = await usdtResponse.json()

            setRates({
                bcv: {
                    usd: bcvData.current.usd,
                    eur: bcvData.current.eur,
                    date: bcvData.current.date,
                    changeUsd: bcvData.changePercentage.usd,
                    changeEur: bcvData.changePercentage.eur
                },
                usdt: {
                    buy: usdtData.ask,
                    sell: usdtData.bid,
                    average: (usdtData.ask + usdtData.bid) / 2,
                    timestamp: Date.now()
                },
                loading: false,
                error: null
            })
        } catch (err) {
            console.error('Error fetching rates:', err)
            setRates(prev => ({ ...prev, loading: false, error: 'Error al cargar las tasas' }))
        }
    }

    useEffect(() => {
        fetchRates()
        const interval = setInterval(fetchRates, 60000) // Update every minute
        return () => clearInterval(interval)
    }, [])

    return rates
}
