// api/chat.js - Vercel Serverless Function
// 
// ⚠️ Vercel 환경변수 설정 필요:
// GEMINI_API_KEY: Google AI Studio (https://aistudio.google.com/app/apikey)

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const SYSTEM_INSTRUCTION = `당신은 Gov-Tech AI 에이전시 '라이트닝(Lightning)'의 전문 AI 컨설턴트입니다. 사용자(공공기관/대기업 담당자)가 프로젝트 아이디어나 요구사항을 말하면, 이를 '라이트닝'의 핵심 역량(전자정부프레임워크 준수, 72시간 내 프로토타이핑, 보안 규정 준수, 2주 내 런칭)을 바탕으로 분석하여 답변하세요. 답변은 전문적이고 신뢰감 있게 하되, 핵심 기술(AI, 모바일, 웹 익스텐션)을 어떻게 활용할지 구체적으로 제안하세요. 답변은 한국어로 작성하며, 중요한 키워드는 **굵게** 표시하세요. 너무 길지 않게 핵심 위주로 답변하세요. 사용자의 요구사항이 충분히 파악되었다고 판단되면(또는 3~4번의 대화 이후), 반드시 응답 마지막에 정확히 "[INQUIRY_COMPLETE]" 라는 태그를 포함하세요.`;

async function callGeminiWithRetry(contents, apiKey, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] }
        })
      });
      if (response.status === 429 || response.status === 503) {
        lastError = new Error(`HTTP ${response.status}`);
        continue;
      }
      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`HTTP ${response.status}: ${errBody}`);
      }
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (err) {
      lastError = err;
      if (err.message && !err.message.startsWith('HTTP 429') && !err.message.startsWith('HTTP 503')) {
        if (attempt === maxRetries - 1) throw err;
      }
    }
  }
  throw lastError;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://flashgta-github-io.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  const { contents } = req.body;
  if (!contents || !Array.isArray(contents)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    const text = await callGeminiWithRetry(contents, apiKey);
    return res.status(200).json({ text });
  } catch (error) {
    console.error('Gemini API error:', error);
    return res.status(500).json({ error: 'Failed to get AI response' });
  }
};