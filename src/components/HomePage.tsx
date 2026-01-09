import USDTPriceChart from './USDTPriceChart'
import '../App.css'

export default function HomePage() {
  return (
    <div className="homepage">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">USDTPriceChart</h1>
          <p className="hero-subtitle">
            Monitoreo en tiempo real del precio de USDT en Bolívares Venezolanos
          </p>
        </div>
      </section>
      
      <section className="chart-section">
        <USDTPriceChart />
      </section>
    </div>
  )
}
