import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function ReportDeep() {
  const { t } = useTranslation()
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
    <div className="min-h-screen bg-black">
      <header className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              <Link to="/" className="text-gray-400 hover:text-white transition-colors">{t('common.back')}</Link>
              <h1 className="text-3xl font-bold text-white mt-2">{t('report.title')}</h1>
              <p className="text-gray-400">{t('report.subtitle')}</p>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">{t('report.scores.title')}</h2>
              {[
                [t('report.scores.overall'), scores.overall, 'bg-white'],
                [t('report.scores.propaganda'), scores.propaganda, 'bg-white'],
                [t('report.scores.conspiracy'), scores.conspiracy, 'bg-white'],
                [t('report.scores.misinfo'), scores.misinfo, 'bg-white']
              ].map(([label, value, color], idx) => (
                <div key={idx} className="mb-4">
                  <div className="flex justify-between text-sm text-gray-300 mb-1">
                    <span>{label}</span>
                    <span className="font-medium text-white">{value}/100</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded">
                    <div className={`h-2 rounded ${color}`} style={bar(value)}></div>
                  </div>
                </div>
              ))}
            </div>

            {Array.isArray(report.techniques) && report.techniques.length > 0 && (
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">{t('report.techniques.title')}</h2>
                <div className="space-y-4">
                  {report.techniques.map((tech, i) => (
                    <div key={i} className="border-l-4 border-white pl-4 pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-white font-medium">{tech.name}</div>
                          {tech.dima_code && (
                            <span className="text-xs px-2 py-0.5 rounded bg-black text-white border border-white font-mono">
                              {tech.dima_code}
                            </span>
                          )}
                          {tech.dima_family && (
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-600">
                              {tech.dima_family}
                            </span>
                          )}
                        </div>
                        {tech.severity && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            tech.severity === 'high' ? 'bg-gray-800 text-white border border-white' :
                            tech.severity === 'medium' ? 'bg-gray-800 text-gray-300 border border-gray-600' :
                            'bg-gray-800 text-gray-500 border border-gray-700'
                          }`}>
                            {t(`report.techniques.severity.${tech.severity}`)}
                          </span>
                        )}
                      </div>
                      {tech.evidence && <div className="text-gray-300 mt-2 italic">« {tech.evidence} »</div>}
                      {tech.explanation && <div className="text-gray-400 text-sm mt-2">{tech.explanation}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(report.claims) && report.claims.length > 0 && (
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">{t('report.claims.title')}</h2>
                <div className="space-y-4">
                  {report.claims.map((c, i) => (
                    <div key={i} className="p-4 bg-black rounded border-l-4 border-white">
                      <div className="text-white font-medium">{c.claim}</div>
                      {c.confidence && (
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-1 rounded border ${
                            c.confidence === 'supported' ? 'bg-gray-800 text-white border-white' :
                            c.confidence === 'unsupported' ? 'bg-gray-800 text-gray-300 border-gray-500' :
                            'bg-gray-800 text-gray-400 border-gray-600'
                          }`}>
                            {t(`report.claims.confidence.${c.confidence}`)}
                          </span>
                        </div>
                      )}
                      {Array.isArray(c.issues) && c.issues.length > 0 && (
                        <div className="text-sm text-gray-400 mt-2">
                          <span className="font-medium text-gray-300">{t('report.claims.problems')} :</span> {c.issues.join(', ')}
                        </div>
                      )}
                      {c.reasoning && (
                        <div className="text-sm text-gray-400 mt-2">
                          <span className="font-medium text-gray-300">{t('report.claims.reasoning')} :</span> {c.reasoning}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-8">
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">{t('report.input.title')}</h3>
              <div className="text-sm text-gray-300 break-all">
                {input.url && <div><span className="font-medium text-white">{t('report.input.url')}:</span> {input.url}</div>}
                {input.platform && <div><span className="font-medium text-white">{t('report.input.platform')}:</span> {input.platform}</div>}
                {input.title && <div className="mt-2"><span className="font-medium text-white">{t('report.input.title_label')}:</span> {input.title}</div>}
                {input.description && <div className="mt-2"><span className="font-medium text-white">{t('report.input.description')}:</span> {input.description}</div>}
              </div>
            </div>

            {report.summary && (
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">{t('report.summary.title')}</h3>
                <p className="text-gray-300">{report.summary}</p>
              </div>
            )}

            {report.transcript_excerpt && (
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">{t('report.transcript.title')}</h3>
                <p className="text-gray-300">{report.transcript_excerpt}</p>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}


