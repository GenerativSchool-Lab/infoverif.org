import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.DEV ? '/api' : import.meta.env.VITE_API_URL

export default function Home() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('url', url)

      const response = await axios.post(`${API_URL}/analyze-lite`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      navigate('/report-lite', { state: { report: response.data } })
    } catch (err) {
      console.error('Erreur lors de l\'analyse de l\'URL :', err)
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">InfoVerif</h1>
          <p className="text-gray-600 mt-2">Analyse d'intégrité des contenus</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Analyse légère
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL du contenu
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Collez une URL YouTube, X/Twitter, TikTok ou un article"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyse en cours…' : "Analyser l'URL"}
            </button>
          </form>

          {/* Info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              ℹ️ Le mode léger fonctionne pour la plupart des liens et analyse uniquement les métadonnées de la page (titre/description).
              <a href="/method-card" className="underline ml-1">En savoir plus</a>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-gray-600 text-sm">
        <a href="/method-card" className="text-blue-600 hover:underline">
          Method & Limitations
        </a>
      </footer>
    </div>
  )
}

