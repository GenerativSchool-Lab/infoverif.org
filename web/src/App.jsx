import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import MethodCard from './pages/MethodCard'
import ReportLite from './pages/ReportLite'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report-lite" element={<ReportLite />} />
        <Route path="/method-card" element={<MethodCard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

