import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Assessment from './pages/Assessment'
import Dashboard from './pages/Dashboard'
import CareerSimulation from './pages/CareerSimulation'
import ResultsDashboard from './pages/ResultsDashboard'
import SimulationChat from './pages/SimulationChat'
import NexusChat from './pages/NexusChat'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/results" element={<ResultsDashboard />} />
        <Route path="/simulation" element={<CareerSimulation />} />
        <Route path="/simulate" element={<SimulationChat />} />
        <Route path="/nexus" element={<NexusChat />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}

export default App
