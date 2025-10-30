export default function MethodCard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Méthode & Feuille de route</h1>
          <p className="text-gray-600 mt-2">Capacités légères actuelles et trajectoire vers une analyse enrichie par les embeddings.</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Capacités actuelles (mode léger)</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Récupération des métadonnées de page (titre, description) pour la plupart des liens</li>
              <li>Extraction de déclarations potentielles à partir des métadonnées</li>
              <li>Calcul d’un score de risque heuristique et interprétable</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Feuille de route à court terme</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Extraction de transcriptions pour les plateformes prises en charge (ASR si nécessaire)</li>
              <li>Extraction de texte à l’écran (OCR) sur les images clés</li>
              <li>Embeddings de texte pour la recherche sémantique et le regroupement des déclarations</li>
              <li>Appariement par similarité avec des vérifications de faits et sources de référence</li>
              <li>Score enrichi basé sur des caractéristiques, avec explications transparentes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Améliorations à moyen terme</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Indices multimodaux (miniature/contexte des images vidéo) pour affiner la détection</li>
              <li>Contexte source/domaine via signaux de réputation et indices de provenance</li>
              <li>Conscience temporelle (récence des affirmations, dynamiques de diffusion, évolution des récits)</li>
              <li>Flux de travail analyste : surlignages, notes, relectures collaboratives</li>
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
              InfoVerif vise à outiller les vérificateurs et communautés avec des signaux rapides et explicables.
              À mesure que les capacités progressent, les résultats intégreront davantage de contexte, d’appariements et de liens probants.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}


