import Equation from '../components/Equation.jsx'

export default function MethodCard() {
  return (
    <div className="min-h-screen bg-black">
      <header className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-white">Méthode & Feuille de route</h1>
          <p className="text-gray-400 mt-2">Objectif : décortiquer les techniques de persuasion, propagande, manipulation émotionnelle et désinformation avec des scores explicables.</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Capacités actuelles (MVP — Analyse IA multi-formats)</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Extraction et transcription multimodale (texte, audio via Whisper, images via Vision API)</li>
              <li>Analyse sémantique contextuelle des déclarations avec détection de 20+ techniques persuasives</li>
              <li>Scores normalisés [0-100] : Intensité persuasive (I), Narratif spéculatif (N), Fiabilité factuelle (F)</li>
              <li className="mt-3">
                <span className="text-white font-medium">Formulation algorithmique :</span>
                <div className="mt-2 space-y-2">
                  <Equation expr={"I_p = \\alpha_1 \\cdot \\text{manipulation\\_émotionnelle} + \\alpha_2 \\cdot \\text{cadrage\\_dichotomique} + \\alpha_3 \\cdot \\text{charge\\_lexicale} + \\alpha_4 \\cdot \\text{appel\\_autorité}"} />
                  <Equation expr={"N_s = \\beta_1 \\cdot \\text{défiance\\_institutionnelle} + \\beta_2 \\cdot \\text{causalité\\_simpliste} + \\beta_3 \\cdot \\text{vérité\\_cachée} + \\beta_4 \\cdot \\text{rhétorique\\_complotiste}"} />
                  <Equation expr={"F_f = \\gamma_1 \\cdot \\text{absence\\_sources} + \\gamma_2 \\cdot \\text{sophismes\\_logiques} + \\gamma_3 \\cdot \\text{cherry\\text{-}picking} + \\gamma_4 \\cdot \\text{hors\\_contexte}"} />
                  <Equation expr={"\\Phi_{influence} = \\frac{I_p + N_s + F_f}{3} \\cdot \\lambda_{\\text{contexte}}"} />
                  <div className="text-xs text-gray-500 mt-2">où α, β, γ ∈ [0,1] sont calibrés par modèles de langage avec prompt structuré, et λ ajuste selon le contexte détecté</div>
                </div>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Phase 2 — Fine-tuning & modèles spécialisés (Q2 2026)</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Fine-tuning BERT/RoBERTa sur corpus annoté de techniques persuasives et manipulatoires</li>
              <li>Embeddings sémantiques pour clustering de narratifs et propagation d'influence</li>
              <li>Vector database des patterns rhétoriques connus avec recherche par similarité cosine</li>
              <li className="mt-3">
                <span className="text-white font-medium">Amélioration de l'indice d'influence :</span>
                <div className="mt-2 space-y-2">
                  <Equation expr={"\\vec{e}_c = \\text{BERT}_{\\text{fine-tuned}}(\\text{content})"} />
                  <Equation expr={"\\text{sim}(\\vec{e}_c, \\vec{e}_k) = \\frac{\\vec{e}_c \\cdot \\vec{e}_k}{\\|\\vec{e}_c\\| \\|\\vec{e}_k\\|}"} />
                  <Equation expr={"\\Phi_{influence}^{v2} = \\omega_1 \\Phi_{LLM} + \\omega_2 \\max_k \\text{sim}(\\vec{e}_c, \\vec{e}_k) + \\omega_3 \\text{classifier}_{BERT}(\\vec{e}_c)"} />
                  <div className="text-xs text-gray-500 mt-2">où ω₁ + ω₂ + ω₃ = 1, combinant analyse LLM, matching de patterns connus, et classification fine-tuned</div>
                </div>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Phase 3 — Analyse de réseaux & monitoring (Q3-Q4 2026)</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Graph Database pour cartographier la propagation de narratifs entre comptes et plateformes</li>
              <li>Détection de comportements coordonnés inautentiques (coordinated inauthentic behavior)</li>
              <li>Analyse temporelle des tendances persuasives et émergence de nouveaux patterns</li>
              <li>Détection multimodale : deepfakes, montage manipulatoire, cohérence audio-vidéo</li>
              <li className="mt-3">
                <span className="text-white font-medium">Modélisation de la propagation d'influence :</span>
                <div className="mt-2 space-y-2">
                  <Equation expr={"G = (V, E, W) \\text{ où } V = \\text{comptes}, E = \\text{partages/citations}, W = \\text{poids d'influence}"} />
                  <Equation expr={"\\text{PageRank}(v_i) = (1-d) + d \\sum_{v_j \\in \\text{in}(v_i)} \\frac{\\text{PageRank}(v_j)}{|\\text{out}(v_j)|}"} />
                  <Equation expr={"\\Psi_{propagation} = \\sum_{v \\in V} \\Phi_{influence}(v) \\cdot \\text{PageRank}(v) \\cdot \\text{reach}(v)"} />
                  <div className="text-xs text-gray-500 mt-2">Quantifie l'impact cumulé d'un narratif à travers son graphe de diffusion</div>
                </div>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Principes éthiques & méthodologiques</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li><span className="text-white font-medium">Transparence :</span> Code open source (MIT), méthodologie documentée, justifications explicables</li>
              <li><span className="text-white font-medium">Confidentialité :</span> Pas de stockage permanent, pas de profilage utilisateur, traitement éphémère</li>
              <li><span className="text-white font-medium">Éducation :</span> Outil pédagogique pour comprendre les mécanismes persuasifs, pas un verdict absolu</li>
              <li><span className="text-white font-medium">Nuance :</span> Contexte culturel, humour et satire peuvent créer des faux positifs</li>
              <li><span className="text-white font-medium">Collaboration :</span> Communauté ouverte, contributions bienvenues (chercheurs, fact-checkers, éducateurs)</li>
            </ul>
          </section>

          <section className="border-t border-gray-800 pt-6">
            <p className="text-gray-400 text-sm leading-relaxed">
              <span className="text-white font-medium">Notre mission :</span> Rendre visibles les mécanismes de persuasion, 
              propagande, manipulation émotionnelle et désinformation via des scores quantifiés, formules mathématiques 
              explicites et éléments de preuve consultables. Un outil d'analyse critique pour des décisions éclairées 
              et auditables, au service de la littératie médiatique et de l'esprit critique.
            </p>
            <div className="mt-4 text-center">
              <a href="/" className="text-gray-400 hover:text-white transition-colors text-sm">← Retour à l'analyse</a>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}


