import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.DEV ? '/api' : import.meta.env.VITE_API_URL

export default function Home() {
  const [activeTab, setActiveTab] = useState('url')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState(null)
  const [language, setLanguage] = useState('fr')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData()
      
      if (activeTab === 'url') {
        formData.append('url', url)
      } else {
        if (!file) {
          alert('Please select a file')
          setLoading(false)
          return
        }
        formData.append('file', file)
      }
      
      formData.append('language', language)

      const response = await axios.post(`${API_URL}/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const jobId = response.data.job_id
      navigate(`/report/${jobId}`)
    } catch (error) {
      console.error('Error submitting video:', error)
      alert('Error submitting video: ' + (error.response?.data?.detail || error.message))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">InfoVerif</h1>
          <p className="text-gray-600 mt-2">Video Integrity Analysis</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Analyze Video
          </h2>

          {/* Tabs */}
          <div className="flex space-x-4 mb-6 border-b">
            <button
              onClick={() => setActiveTab('url')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'url'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600'
              }`}
            >
              YouTube URL
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'upload'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600'
              }`}
            >
              Upload Video
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'url' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Video File
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  Supported formats: MP4, AVI, MOV
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="fr">French</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="de">German</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Analyze Video'}
            </button>
          </form>

          {/* Info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              ℹ️ All video data is automatically deleted after 48 hours.
              <a href="/method-card" className="underline ml-1">Learn more</a>
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

