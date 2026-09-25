export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { question, chosen, correct, correctAnswer, context, module } = req.body;
  if (!question || !chosen) {
    return res.status(400).json({ error: 'Parámetros requeridos faltantes' });
  }

  const mod = module === 'candidato'
    ? 'candidato que está preparando una entrevista'
    : 'entrevistador que está aprendiendo a evaluar candidatos';

  const prompt = `Sos un recruiter IT senior con 10 años de experiencia. Un ${mod} respondió esta pregunta de preparación:

Pregunta: "${question}"
Respuesta elegida: "${chosen}"
Era ${correct ? 'CORRECTA' : 'INCORRECTA'}.
Respuesta correcta: "${correctAnswer}"
Contexto: ${context}

Dá un feedback breve y personalizado (2-3 oraciones máximo) sobre la respuesta elegida. Sé directo, útil y humano. Si fue correcta, reforzá por qué importa ese concepto. Si fue incorrecta, explicá el error de forma constructiva sin repetir lo que ya saben. No uses bullets ni headers.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.map(b => b.text || '').join('') || '';
    return res.status(200).json({ text });

  } catch (error) {
    return res.status(500).json({ error: 'Error al generar feedback' });
  }
}
