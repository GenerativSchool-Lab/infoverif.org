import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function ReportLite() {
  const location = useLocation()
  const navigate = useNavigate()
  const report = location.state?.report

  if (!report) {
    // If navigated directly without state, send back home
    navigate('/')
    return null
  }

  const score = report.heuristics?.score ?? 0
  const reasons = report.heuristics?.reasons || []
  const features = report.heuristics?.features || {}
  const input = report.input || {}
  const claims = report.claims || []

  const scoreClass =
    score < 30 ? 'text-green-600' : score < 60 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Lightweight Report</h1>
          <p className="text-gray-600">Metadata-based heuristics</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Score */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Risk Score</h2>
                <div className={`text-4xl font-bold ${scoreClass}`}>{score}/100</div>
              </div>
              {reasons.length > 0 && (
                <div className="mt-4 space-y-2">
                  {reasons.map((r, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-gray-700">{r.label}</span>
                      <span className="text-sm text-gray-500">{Math.abs(r.weight)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Claims (from metadata) */}
            {claims.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Extracted Statements</h2>
                <ul className="space-y-3">
                  {claims.map((c, idx) => (
                    <li key={idx} className="border-l-4 border-blue-500 pl-4">
                      <p className="text-gray-800">{c.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar: Input & Features */}
          <aside className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Input</h3>
              <div className="text-sm text-gray-700 break-all">
                <div><span className="font-medium">URL:</span> {input.url}</div>
                {input.platform && (
                  <div><span className="font-medium">Platform:</span> {input.platform}</div>
                )}
                {input.title && (
                  <div className="mt-2"><span className="font-medium">Title:</span> {input.title}</div>
                )}
                {input.description && (
                  <div className="mt-2"><span className="font-medium">Description:</span> {input.description}</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Heuristic Features</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>sensational_terms: {features.sensational_terms ?? 0}</li>
                <li>numbers: {features.numbers ?? 0}</li>
                <li>unknown_domains: {features.unknown_domains ?? 0}</li>
              </ul>
            </div>

            <div className="text-sm text-gray-500">
              <p>
                This lightweight report is based on page metadata only (no transcript/OCR).
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}


