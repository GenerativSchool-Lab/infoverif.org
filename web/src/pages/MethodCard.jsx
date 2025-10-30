export default function MethodCard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Method & Limitations</h1>
          <p className="text-gray-600 mt-2">Overview of the lightweight (metadata-only) analysis and caveats.</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">What we do (Lite)</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Fetch page metadata (title and description)</li>
              <li>Extract potential statements from metadata</li>
              <li>Compute a heuristic risk score from simple features</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Limitations</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Heuristics may produce false positives/negatives</li>
              <li>No transcript or on-screen text analysis in Lite mode</li>
              <li>No fact-check matching in Lite mode</li>
              <li>External pages can change or become unavailable</li>
            </ul>
          </section>
          <section className="text-sm text-gray-500">
            <p>
              This lite tool assists human reviewers. Do not rely solely on the score; always
              review the original content and context.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}


