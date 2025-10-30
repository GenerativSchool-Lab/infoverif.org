import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Report from './pages/Report'
import MethodCard from './pages/MethodCard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report/:jobId" element={<Report />} />
        <Route path="/method-card" element={<MethodCard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

