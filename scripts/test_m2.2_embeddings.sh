#!/bin/bash
# Test M2.2 Embeddings on Railway Production

set -e

API_URL="https://infoveriforg-production.up.railway.app"

echo "🧪 Testing DIMA M2.2 Semantic Embeddings"
echo "========================================"
echo ""

# Test 1: Health check with embeddings status
echo "📊 Test 1: Health Check"
echo "-----------------------"
curl -sS "$API_URL/health" | jq '.'
echo ""

# Test 2: Conspiracy theory content (should trigger TE-58, TE-62, TE-31)
echo "📊 Test 2: Conspiracy Theory Content"
echo "-------------------------------------"
echo "Content: 'Les élites mondiales cachent la vérité sur les vaccins...'"
RESULT=$(curl -sS -X POST "$API_URL/analyze-text" \
  -F 'text=Les élites mondiales cachent la vérité sur les vaccins. Big Pharma contrôle les médias et les gouvernements. Réveillez-vous avant qu il soit trop tard! Faites vos propres recherches!' \
  -F 'platform=test')

echo "$RESULT" | jq '{
  embedding_hints: .embedding_hints,
  detected_codes: [.techniques[].dima_code],
  top_technique: .techniques[0].name,
  scores: {
    propaganda: .propaganda_score,
    conspiracy: .conspiracy_score,
    misinfo: .misinfo_score
  }
}'
echo ""

# Test 3: Emotional manipulation (should trigger TE-01, TE-02, TE-21)
echo "📊 Test 3: Emotional Manipulation"
echo "----------------------------------"
echo "Content: 'Nos enfants sont en danger...'"
curl -sS -X POST "$API_URL/analyze-text" \
  -F 'text=Nos enfants sont en DANGER! Le gouvernement veut DÉTRUIRE nos familles! Partagez MASSIVEMENT avant qu ils ne censurent cette vérité!' \
  -F 'platform=test' | jq '{
  embedding_hints: .embedding_hints,
  detected_codes: [.techniques[].dima_code],
  top_technique: .techniques[0].name
}'
echo ""

# Test 4: Neutral content (should have low scores, few techniques)
echo "📊 Test 4: Neutral Content (Control)"
echo "------------------------------------"
echo "Content: 'Le conseil municipal a voté...'"
curl -sS -X POST "$API_URL/analyze-text" \
  -F 'text=Le conseil municipal a voté hier soir le budget 2025. La séance a duré trois heures. Les débats ont porté sur les infrastructures.' \
  -F 'platform=test' | jq '{
  embedding_hints: .embedding_hints,
  detected_codes: [.techniques[].dima_code],
  scores: {
    propaganda: .propaganda_score,
    conspiracy: .conspiracy_score,
    misinfo: .misinfo_score
  }
}'
echo ""

echo "✅ Tests completed!"
echo ""
echo "📈 Key Metrics to Check:"
echo "  1. embedding_hints should be present (non-null array)"
echo "  2. Conspiracy content should have TE-58 or TE-62"
echo "  3. Emotional content should have TE-01 or TE-02"
echo "  4. Neutral content should have low scores (<30)"

