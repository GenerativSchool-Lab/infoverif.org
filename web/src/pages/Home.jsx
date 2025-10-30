import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export default function Home() {
  const [activeTab, setActiveTab] = useState('text')
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let response
      if (activeTab === 'text') {
        if (!text || !text.trim()) throw new Error('Veuillez saisir un texte')
        const form = new FormData()
        form.append('text', text)
        response = await axios.post(`${API_URL}/analyze-text`, form)
      } else if (activeTab === 'video') {
        if (!file) throw new Error('Veuillez sélectionner un fichier vidéo')
        const form = new FormData()
        form.append('file', file)
        response = await axios.post(`${API_URL}/analyze-video`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        if (!file) throw new Error('Veuillez sélectionner une image')
        const form = new FormData()
        form.append('file', file)
        response = await axios.post(`${API_URL}/analyze-image`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      }

      navigate('/report-deep', { state: { report: response.data } })
    } catch (err) {
      console.error('Erreur lors de l\'analyse :', err)
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
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Analyse avancée</h2>

          <div className="flex gap-4 border-b mb-6">
            {['text','video','image'].map((t) => (
              <button
                key={t}
                onClick={() => { setActiveTab(t); setError(null); setFile(null); }}
                className={`px-4 py-2 font-medium ${activeTab===t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
              >
                {t === 'text' ? 'Texte' : t === 'video' ? 'Vidéo' : 'Capture'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Texte (coller ou écrire)</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={6}
                  placeholder="Collez un post, un article ou un script…"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus-border-transparent"
                />
              </div>
            )}

            {activeTab === 'video' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléverser une vidéo</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">Taille conseillée ≤ 60 Mo.</p>
              </div>
            )}

            {activeTab === 'image' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléverser une capture (PNG/JPG)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">Capture de posts (Twitter/X, TikTok, etc.).</p>
              </div>
            )}

            {error && (
              <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyse en cours…' : "Lancer l\'analyse"}
            </button>
          </form>

          {/* Info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              ℹ️ L\'analyse avancée utilise la transcription (captions/Whisper) et une analyse sémantique.
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

