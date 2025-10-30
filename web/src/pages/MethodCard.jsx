export default function MethodCard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Méthode & Feuille de route</h1>
          <p className="text-gray-600 mt-2">Objectif : décortiquer la propagande et les techniques de communication avec des scores explicables.</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Capacités actuelles (analyse avancée par défaut)</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Transcription du contenu et segmentation en unités analysables (phrases, slogans, chiffres).</li>
              <li>Analyse sémantique des déclarations et détection de techniques avec extraits probants.</li>
              <li>Scores principaux : P (propagande), C (conspiration), M (désinformation), et risque global R.</li>
              <li>Formulation : P = w₁·émotion + w₂·cadre_{eux/nous} + w₃·charge_lexicale + w₄·sélection_partielle ; R = f(P, C, M).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Mode léger (secours)</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Analyse sur métadonnées (titre + description) lorsque la transcription n’est pas disponible.</li>
              <li>Score heuristique : S = min(100, 5·T + 3·N + 10·D) avec T, N, D explicables.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Feuille de route à court terme</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Transcription + texte à l’écran : extraction de segments temporels (phrases, slogans, chiffres clés).</li>
              <li>Représentations sémantiques : vecteurs de phrases pour regrouper et rapprocher les idées proches.</li>
              <li>Appariement sémantique : similarité cosine avec vérifications/archives pour repérer des narratifs connus.</li>
              <li>Score de propagande multi‑composantes : P = w₁·émotion + w₂·cadre_{eux/nous} + w₃·charge_lexicale + w₄·sélection_partielle.
                <div className="text-xs text-gray-500">Poids wᵢ calibrés empiriquement et expliqués dans le rapport.</div>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Améliorations à moyen terme</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Structure rhétorique : repérer accumulation, faux dilemme, glissement sémantique, appels d’autorité.</li>
              <li>Trajectoires narratives : détection d’« épisodes » et d’éléments récurrents dans le temps (narrative drift).</li>
              <li>Contexte des sources : signaux de fiabilité et réseaux de citation/domaines pour contextualiser les références.</li>
              <li>Tableau de bord analyste : extraits clés, justification des scores, annotations collaboratives.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Principes de confidentialité & sûreté</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Minimisation des données et rétention courte pour les contenus soumis</li>
              <li>Transparence : fonctionnalités explicables et justifications visibles des appariements</li>
              <li>Pas de pistage ni de profilage au‑delà du nécessaire pour rendre le service</li>
            </ul>
          </section>

          <section className="text-sm text-gray-600">
            <p>
              Notre cap : rendre visibles les mécanismes de persuasion et de propagande via des scores, formules
              et éléments de preuve consultables, pour des décisions éclairées et auditables.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}


