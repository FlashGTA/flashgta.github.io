// api/chat.js - Vercel Serverless Function
//
// ⚠️ Vercel 환경변수 설정 필요:
// GEMINI_API_KEY: Google AI Studio (https://aistudio.google.com/app/apikey)

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const SYSTEM_INSTRUCTION = `당신은 라이트닝(Lightning)의 AI 접수 어시스턴트입니다.
당신의 역할은 사용자의 프로젝트 요구사항을 파악해서 전문 상담사에게 전달하는 것입니다.
직접 컨설팅하거나 기술을 설명하는 것이 아닙니다.

[절대 규칙 - 반드시 지켜야 함]
1. 한 번에 질문 하나만 하세요.
2. 답변은 최대 2문장을 넘지 마세요.
3. 번호 목록, 글머리 기호(*, -, •) 절대 사용 금지.
4. 기술 설명, 기능 제안, 서비스 홍보 절대 금지.
5. 쉬운 말로만 대화하세요.

[대화 전략]
- 첫 번째 답변: 공감 한 문장 + 맥락 파악을 위한 질문 하나
- 두 번째 답변: 답변 수용 한 문장 + 추가 질문 하나 OR [INQUIRY_COMPLETE]
- 세 번째 답변: 반드시 [INQUIRY_COMPLETE] 포함

[파악해야 할 핵심 정보 - 자연스럽게 대화로 수집]
- 사용 대상 (누가 쓰나요?)
- 주요 목적 (무엇을 위해?)
- 일정 또는 긴급도

[나쁜 답변 예시 - 절대 이렇게 하지 마세요]
"저희 라이트닝은 전자정부프레임워크를 준수하며 72시간 내 프로토타이핑, 2주 내 런칭이 가능합니다. 다음과 같은 기능을 제안드립니다: 1. 모바일 앱 2. 웹 관리 시스템 3. AI 분석..."

[좋은 답변 예시]
사용자: "설문 조사 앱이 필요해"
AI: "어떤 분들을 대상으로 한 설문인가요?"

사용자: "직원 만족도 조사요"
AI: "몇 명 정도 참여하고, 언제까지 필요하신가요? [INQUIRY_COMPLETE]"`;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://flashgta-github-io.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  const { contents } = req.body;
  if (!contents || !Array.isArray(contents)) return res.status(400).json({ error: 'Invalid request body' });

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] }
      })
    });

    if (response.status === 429) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
    }

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`HTTP ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
  } catch (error) {
    console.error('Gemini API error:', error);
    return res.status(500).json({ error: 'Failed to get AI response' });
  }
};