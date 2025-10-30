import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function ReportLite() {
  const location = useLocation()
  const navigate = useNavigate()
  const report = location.state?.report

  if (!report) {
    // Redirection si accès direct sans état
    navigate('/')
    return null
  }

  const score = report.heuristics?.score ?? 0
  const reasons = report.heuristics?.reasons || []
  const features = report.heuristics?.features || {}
  const input = report.input || {}
  const claims = report.claims || []

  // Détection du rapport avancé (deep)
  const isDeep =
    typeof report.overall_risk === 'number' || typeof report.propaganda_score === 'number'

  const scoreClass =
    score < 30 ? 'text-green-600' : score < 60 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to="/" className="text-blue-600 hover:underline">
            ← Retour à l’accueil
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{isDeep ? 'Rapport avancé' : 'Rapport léger'}</h1>
          <p className="text-gray-600">
            {isDeep ? 'Transcription + analyse sémantique' : 'Heuristiques basées sur les métadonnées'}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Scores */}
            {isDeep ? (
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Scores</h2>
                  <div className={`text-4xl font-bold ${scoreClass}`}>{report.overall_risk ?? 0}/100</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-500">Propagande</div>
                    <div className="text-lg font-semibold">{report.propaganda_score ?? 0}/100</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-500">Complotisme</div>
                    <div className="text-lg font-semibold">{report.conspiracy_score ?? 0}/100</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-500">Désinformation</div>
                    <div className="text-lg font-semibold">{report.misinfo_score ?? 0}/100</div>
                  </div>
                </div>
                {Array.isArray(report.techniques) && report.techniques.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Techniques</h3>
                    <ul className="space-y-2">
                      {report.techniques.map((t, idx) => (
                        <li key={idx} className="p-3 bg-gray-50 rounded">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-800">{t.name}</span>
                            <span className="text-sm text-gray-500">{t.severity}</span>
                          </div>
                          {t.evidence && <div className="text-sm text-gray-700 mt-1">“{t.evidence}”</div>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Score de risque</h2>
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
            )}

            {/* Déclarations */}
            {isDeep ? (
              Array.isArray(report.claims) && report.claims.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Déclarations analysées</h2>
                  <ul className="space-y-3">
                    {report.claims.map((c, idx) => (
                      <li key={idx} className="border-l-4 border-blue-500 pl-4">
                        <p className="text-gray-800">{c.claim}</p>
                        <div className="text-sm text-gray-600 mt-1">
                          Confiance : {c.confidence} {Array.isArray(c.issues) && c.issues.length > 0 ? `• Problèmes : ${c.issues.join(', ')}` : ''}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ) : (
              claims.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Déclarations extraites</h2>
                <ul className="space-y-3">
                  {claims.map((c, idx) => (
                    <li key={idx} className="border-l-4 border-blue-500 pl-4">
                      <p className="text-gray-800">{c.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
              )
            )}
          </div>

          {/* Barre latérale : Entrée & Caractéristiques */}
          <aside className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Entrée</h3>
              <div className="text-sm text-gray-700 break-all">
                <div><span className="font-medium">URL :</span> {input.url}</div>
                {input.platform && (
                  <div><span className="font-medium">Plateforme :</span> {input.platform}</div>
                )}
                {input.title && (
                  <div className="mt-2"><span className="font-medium">Titre :</span> {input.title}</div>
                )}
                {input.description && (
                  <div className="mt-2"><span className="font-medium">Description :</span> {input.description}</div>
                )}
              </div>
            </div>

            {isDeep ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aperçu de transcription</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {report.transcript_excerpt || '—'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Caractéristiques heuristiques</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>termes_sensationnalistes : {features.sensational_terms ?? 0}</li>
                  <li>nombres/statistiques : {features.numbers ?? 0}</li>
                  <li>domaines_inconnus : {features.unknown_domains ?? 0}</li>
                </ul>
              </div>
            )}

            <div className="text-sm text-gray-500">
              <p>
                {isDeep
                  ? "Ce rapport avancé s’appuie sur la transcription et une analyse sémantique."
                  : "Ce rapport léger est uniquement basé sur les métadonnées de la page (pas de transcription/OCR)."}
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}


