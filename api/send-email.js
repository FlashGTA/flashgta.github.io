// api/send-email.js - Vercel Serverless Function
//
// ⚠️ Vercel 환경변수 설정 필요:
// EMAILJS_PUBLIC_KEY:  EmailJS 대시보드 > Account > Public Key
// EMAILJS_PRIVATE_KEY: EmailJS 대시보드 > Account > Private Key
// EMAILJS_SERVICE_ID:  EmailJS 대시보드 > Email Services
// EMAILJS_TEMPLATE_ID: EmailJS 대시보드 > Email Templates

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

  // Honeypot 검증
  if (req.body.honeypot) {
    return res.status(400).json({ error: 'Bot detected' });
  }

  const { visitor_name, contact, inquiry_summary, full_conversation, date } = req.body;
  if (!visitor_name || !contact) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;

  if (!publicKey || !privateKey || !serviceId || !templateId) {
    return res.status(500).json({ error: 'EmailJS not configured' });
  }

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        accessToken: privateKey,
        template_params: {
          visitor_name,
          contact,
          inquiry_summary: inquiry_summary || '(요약 없음)',
          full_conversation: full_conversation || '(대화 내용 없음)',
          date: date || new Date().toLocaleString('ko-KR')
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('EmailJS error:', errText);
      return res.status(500).json({ error: 'Email send failed' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({ error: 'Email send failed' });
  }
};
