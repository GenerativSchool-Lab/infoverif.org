import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.DEV ? '/api' : import.meta.env.VITE_API_URL

export default function Report() {
  const { jobId } = useParams()
  const [status, setStatus] = useState(null)
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isCancelled = false
    let timeoutId

    const pollStatus = async () => {
      try {
        const response = await axios.get(`${API_URL}/status/${jobId}`)
        if (isCancelled) return
        setStatus(response.data)

        if (response.data.status === 'done') {
          const reportResp = await axios.get(`${API_URL}/report/${jobId}`)
          if (isCancelled) return
          setReport(reportResp.data)
        } else if (response.data.status === 'failed') {
          setError(response.data.message || 'Analysis failed')
        } else {
          timeoutId = setTimeout(pollStatus, 2000)
        }
      } catch (err) {
        if (isCancelled) return
        setError(err.message)
      }
    }

    pollStatus()

    return () => {
      isCancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [jobId])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error}</p>
          <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 mb-2">{status?.message || 'Processing...'}</p>
          <div className="w-64 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${status?.progress || 0}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">{status?.progress || 0}% complete</p>
        </div>
      </div>
    )
  }

  // Report display
  const riskScore = report.risk.score
  const riskColorClass =
    riskScore < 30
      ? 'text-green-600'
      : riskScore < 60
      ? 'text-yellow-600'
      : 'text-red-600'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Analysis Report</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Risk Score Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Risk Score</h2>
            <div className={`text-4xl font-bold ${riskColorClass}`}>
              {report.risk.score}/100
            </div>
          </div>

          {/* Top Reasons */}
          {report.risk.reasons.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Top Risk Factors</h3>
              <div className="space-y-2">
                {report.risk.reasons.slice(0, 3).map((reason, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-gray-700">{reason.label}</span>
                    <span className="text-sm text-gray-500">{Math.abs(reason.weight)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        {report.timelines && report.timelines.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Timeline</h2>
            <div className="space-y-4">
              {report.timelines.slice(0, 10).map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="text-sm text-gray-500 w-20">
                    {Math.floor(item.ts)}s
                  </div>
                  <div className="flex-1">
                    {item.flags && item.flags.length > 0 && (
                      <div className="flex gap-2 mb-2">
                        {item.flags.map((flag, fIdx) => (
                          <span
                            key={fIdx}
                            className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded"
                          >
                            {flag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-gray-700">{item.excerpt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transcript */}
        {report.asr && report.asr.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Transcript</h2>
            <div className="space-y-4">
              {report.asr.map((seg, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-4">
                  <div className="text-sm text-gray-500">
                    {Math.floor(seg.start)}s - {Math.floor(seg.end)}s
                  </div>
                  <p className="text-gray-700 mt-1">{seg.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* On-screen Text */}
        {report.ocr_samples && report.ocr_samples.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">On-Screen Text</h2>
            <div className="space-y-3">
              {report.ocr_samples.map((sample, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="text-sm text-gray-500 w-20">
                    {Math.floor(sample.ts)}s
                  </div>
                  <p className="text-gray-700">{sample.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fact-checks */}
        {report.sources && report.sources.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Related Fact-checks</h2>
            <div className="space-y-4">
              {report.sources.map((source, idx) => (
                <div key={idx} className="border-l-4 border-green-500 pl-4 py-3 bg-green-50">
                  <h3 className="font-medium text-gray-900 mb-1">{source.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{source.text}</p>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View source →
                  </a>
                  <span className="ml-3 text-sm text-gray-500">
                    {Math.round(source.similarity * 100)}% match
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-gray-600 text-sm pb-8">
        <Link to="/method-card" className="text-blue-600 hover:underline">
          Method & Limitations
        </Link>
        <span className="mx-2">•</span>
        <Link to="/" className="text-blue-600 hover:underline">
          Analyze Another Video
        </Link>
      </footer>
    </div>
  )
}

