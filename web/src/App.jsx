import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import MethodCard from './pages/MethodCard'
import ReportDeep from './pages/ReportDeep'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report-deep" element={<ReportDeep />} />
        <Route path="/method-card" element={<MethodCard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

