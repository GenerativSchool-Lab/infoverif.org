export default function MethodCard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Method & Limitations</h1>
          <p className="text-gray-600 mt-2">An overview of our analysis pipeline and caveats.</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">What we do</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Transcribe speech and summarize key statements</li>
              <li>Detect visual/text anomalies and potential manipulations</li>
              <li>Surface related fact-checks using semantic search</li>
              <li>Compute a heuristic risk score</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Limitations</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Heuristics may produce false positives/negatives</li>
              <li>OCR/ASR quality varies with audio/video conditions</li>
              <li>External sources may change or become unavailable</li>
            </ul>
          </section>
          <section className="text-sm text-gray-500">
            <p>
              This tool assists human reviewers. Do not rely solely on the score; always
              examine the evidence and sources.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}


