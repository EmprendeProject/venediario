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
            // Try official BCV API first (currently requiring auth, so we skip or use fallback)
            // Fallback to ve.dolarapi.com which is free and open
            const bcvResponse = await fetch('https://ve.dolarapi.com/v1/dolares/oficial')
            
            if (bcvResponse.ok) {
                const bcvData = await bcvResponse.json()
                
                // Note: This API primarily gives USD. We'll use 0 for EUR if not found, 
                // or try to approximate/fetch from another endpoint if needed.
                // It doesn't provide change% directly, so we'll set to 0 to avoid crashes.
                newRates.bcv = {
                    usd: bcvData.promedio,
                    eur: 0, // Not available in this endpoint
                    date: bcvData.fechaActualizacion || new Date().toISOString(),
                    changeUsd: 0, // Not available
                    changeEur: 0  // Not available
                }
            } else {
                console.error('BCV API Error:', bcvResponse.status)
                // If this fails, we just don't set bcv, so it remains null (or previous value)
            }

            // 3. Fetch Cross Rate USD/EUR (to calculate BCV EUR)
            // Since BCV doesn't provide EUR in the free API, we calculate it: EUR_BCV = USD_BCV * (1 / EUR_USD_RATE)
            if (newRates.bcv && newRates.bcv.usd > 0) {
                try {
                    const crossRateResponse = await fetch('https://open.er-api.com/v6/latest/USD')
                    if (crossRateResponse.ok) {
                        const crossRateData = await crossRateResponse.json()
                        const eurToUsd = crossRateData.rates.EUR
                        // If 1 USD = 0.92 EUR, then 1 EUR = 1/0.92 USD = 1.08 USD
                        // So if BCV USD is 355, then BCV EUR should be 355 * (1/0.92) approx.
                        
                        // Actually logic: 
                        // We want price of 1 EUR in VES.
                        // We have price of 1 USD in VES (newRates.bcv.usd).
                        // We have price of 1 USD in EUR (eurToUsd). 
                        // 1 EUR = (1 / eurToUsd) USD.
                        // Value of 1 EUR in VES = (1 / eurToUsd) * Value of 1 USD in VES.
                        
                        if (eurToUsd) {
                            newRates.bcv.eur = newRates.bcv.usd * (1 / eurToUsd)
                        }
                    }
                } catch (err) {
                    console.error('Error fetching cross rates:', err)
                }
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
