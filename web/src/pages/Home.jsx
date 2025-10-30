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
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-white">🛡️ InfoVerif.org</h1>
          <p className="text-gray-400 mt-2">Analyse de propagande, désinformation & manipulation médiatique</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Analyse avancée</h2>

          <div className="flex gap-4 border-b border-gray-800 mb-6">
            {['text','video','image'].map((t) => (
              <button
                key={t}
                onClick={() => { setActiveTab(t); setError(null); setFile(null); }}
                className={`px-4 py-2 font-medium ${activeTab===t ? 'text-white border-b-2 border-white' : 'text-gray-500'}`}
              >
                {t === 'text' ? 'Texte' : t === 'video' ? 'Vidéo' : 'Capture'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Texte (coller ou écrire)</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={6}
                  placeholder="Collez un post, un article ou un script…"
                  className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-white focus:border-transparent"
                />
              </div>
            )}

            {activeTab === 'video' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Téléverser une vidéo</label>
                <div className="relative border-2 border-dashed border-gray-700 rounded-lg p-8 hover:border-white transition-colors cursor-pointer bg-black">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {file ? (
                      <p className="mt-2 text-sm text-white font-medium">{file.name}</p>
                    ) : (
                      <>
                        <p className="mt-2 text-sm text-gray-300">
                          <span className="font-medium text-white">Cliquez pour téléverser</span> ou glissez-déposez
                        </p>
                        <p className="mt-1 text-xs text-gray-500">MP4, MOV, AVI jusqu'à 60 Mo</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'image' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Téléverser une capture (PNG/JPG)</label>
                <div className="relative border-2 border-dashed border-gray-700 rounded-lg p-8 hover:border-white transition-colors cursor-pointer bg-black">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6 6h.01M6 20h36a2 2 0 012 2v20a2 2 0 01-2 2H6a2 2 0 01-2-2V22a2 2 0 012-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {file ? (
                      <p className="mt-2 text-sm text-white font-medium">{file.name}</p>
                    ) : (
                      <>
                        <p className="mt-2 text-sm text-gray-300">
                          <span className="font-medium text-white">Cliquez pour téléverser</span> ou glissez-déposez
                        </p>
                        <p className="mt-1 text-xs text-gray-500">PNG, JPG, WEBP · Capture de posts (Twitter/X, TikTok, etc.)</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded bg-red-900 border border-red-700 text-red-200 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Analyse en cours…' : "Lancer l\'analyse"}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 pb-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-800 pt-8">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">
                Projet Open Source — GenerativSchool.com
              </p>
              <p className="text-xs text-gray-600 mb-4">
                Contributions bienvenues · Code MIT License
              </p>
              <div className="flex justify-center gap-6 text-sm">
                <a href="/method-card" className="text-gray-400 hover:text-white transition-colors">
                  Méthode & Roadmap
                </a>
                <a href="https://github.com/GenerativSchool-Lab/infoverif.org" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  GitHub
                </a>
                <a href="https://generativschool.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  À propos
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

