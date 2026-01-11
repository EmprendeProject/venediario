import { App as KonstaApp, KonstaProvider } from 'konsta/react'
import HomePage from './components/HomePage'
import './App.css'

function App() {
  return (
    <KonstaProvider theme="ios">
      <KonstaApp safeAreas>
        <div className="min-h-screen bg-[#f5f5f7]">
          <div className="max-w-[600px] mx-auto bg-[#f5f5f7] shadow-xl min-h-screen">
            <HomePage />
          </div>
        </div>
      </KonstaApp>
    </KonstaProvider>
  )
}

export default App
