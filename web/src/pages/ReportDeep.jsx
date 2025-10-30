import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function ReportDeep() {
  const location = useLocation()
  const navigate = useNavigate()
  const report = location.state?.report

  if (!report) {
    navigate('/')
    return null
  }

  const input = report.input || {}
  const scores = {
    propaganda: report.propaganda_score ?? 0,
    conspiracy: report.conspiracy_score ?? 0,
    misinfo: report.misinfo_score ?? 0,
    overall: report.overall_risk ?? Math.round(((report.propaganda_score ?? 0) + (report.conspiracy_score ?? 0) + (report.misinfo_score ?? 0)) / 3)
  }

  const bar = (v) => ({ width: `${Math.max(0, Math.min(100, v))}%` })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to="/" className="text-blue-600 hover:underline">← Retour</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Analyse approfondie</h1>
          <p className="text-gray-600">Propagande, conspiration, désinformation</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Scores</h2>
              {[
                ['Score global', scores.overall, 'bg-blue-600'],
                ['Propagande', scores.propaganda, 'bg-red-600'],
                ['Conspiration', scores.conspiracy, 'bg-yellow-600'],
                ['Désinformation', scores.misinfo, 'bg-purple-600']
              ].map(([label, value, color], idx) => (
                <div key={idx} className="mb-4">
                  <div className="flex justify-between text-sm text-gray-700 mb-1">
                    <span>{label}</span>
                    <span className="font-medium">{value}/100</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded">
                    <div className={`h-2 rounded ${color}`} style={bar(value)}></div>
                  </div>
                </div>
              ))}
            </div>

            {Array.isArray(report.techniques) && report.techniques.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Techniques détectées</h2>
                <div className="space-y-4">
                  {report.techniques.map((t, i) => (
                    <div key={i} className="border-l-4 border-blue-500 pl-4 pb-3">
                      <div className="flex items-center justify-between">
                        <div className="text-gray-900 font-medium">{t.name}</div>
                        {t.severity && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            t.severity === 'high' ? 'bg-red-100 text-red-800' :
                            t.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {t.severity === 'high' ? 'Élevé' : t.severity === 'medium' ? 'Moyen' : 'Faible'}
                          </span>
                        )}
                      </div>
                      {t.evidence && <div className="text-gray-700 mt-2 italic">« {t.evidence} »</div>}
                      {t.explanation && <div className="text-gray-600 text-sm mt-2">{t.explanation}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(report.claims) && report.claims.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Affirmations analysées</h2>
                <div className="space-y-4">
                  {report.claims.map((c, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded border-l-4 border-purple-500">
                      <div className="text-gray-800 font-medium">{c.claim}</div>
                      {c.confidence && (
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            c.confidence === 'supported' ? 'bg-green-100 text-green-800' :
                            c.confidence === 'unsupported' ? 'bg-red-100 text-red-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {c.confidence === 'supported' ? 'Supportée' : 
                             c.confidence === 'unsupported' ? 'Non supportée' : 
                             'Trompeuse'}
                          </span>
                        </div>
                      )}
                      {Array.isArray(c.issues) && c.issues.length > 0 && (
                        <div className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Problèmes :</span> {c.issues.join(', ')}
                        </div>
                      )}
                      {c.reasoning && (
                        <div className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Raisonnement :</span> {c.reasoning}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Entrée</h3>
              <div className="text-sm text-gray-700 break-all">
                {input.url && <div><span className="font-medium">URL:</span> {input.url}</div>}
                {input.platform && <div><span className="font-medium">Plateforme:</span> {input.platform}</div>}
                {input.title && <div className="mt-2"><span className="font-medium">Titre:</span> {input.title}</div>}
                {input.description && <div className="mt-2"><span className="font-medium">Description:</span> {input.description}</div>}
              </div>
            </div>

            {report.summary && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Résumé</h3>
                <p className="text-gray-700">{report.summary}</p>
              </div>
            )}

            {report.transcript_excerpt && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Extrait de transcription</h3>
                <p className="text-gray-700">{report.transcript_excerpt}</p>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}


