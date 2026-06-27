import { Request, Response } from 'express';

export class ChatbotController {
  public static async getChatResponse(req: Request, res: Response) {
    try {
      const { message: userMessage, sensorData } = req.body;

      if (!userMessage || typeof userMessage !== 'string' || userMessage.trim() === '') {
        return res.status(400).json({
          success: false,
          error: "Field 'message' is required and must be a non-empty string.",
        });
      }

      if (!sensorData || typeof sensorData !== 'object') {
        return res.status(400).json({
          success: false,
          error: "Field 'sensorData' is required and must be an object.",
        });
      }

      if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_api_key_here') {
        return res.status(503).json({
          success: false,
          error: 'GROQ_API_KEY not configured. Add it to your environment variables.',
        });
      }

      const {
        heartRate = '—',
        restingHR = '—',
        spo2 = '—',
        temperature = '—',
        hrv = '—',
        stressScore = '—',
        activityIndex = '—',
        sleepScore = '—',
        posture = '—',
        fallDetected = false,
        bellyExpansion = '—',
        mws = '—',
        pregnancyWeek = '—',
      } = sensorData;

      const systemPrompt = `You are a caring maternal health assistant for a Smart Maternal Belt app.

Current real-time readings:
- Heart rate: ${heartRate} bpm (resting: ${restingHR} bpm)
- Blood oxygen: ${spo2}%
- Temperature: ${temperature}°C
- HRV: ${hrv} ms
- Stress score: ${stressScore}/100
- Activity index: ${activityIndex}
- Sleep quality: ${sleepScore}/100
- Posture: ${posture}
- Fall detected: ${fallDetected ? 'YES — EMERGENCY' : 'No'}
- Belly expansion: ${bellyExpansion}%
- Maternal Wellness Score: ${mws}/100
- Pregnancy week: ${pregnancyWeek}

Always refer to the exact numbers above. Keep answers short — 2 to 4 sentences. Speak directly to the mother as "you". Do not diagnose — suggest consulting a doctor for serious concerns.`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          max_tokens: 300,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Groq API error ${response.status}: ${err}`);
      }

      const data = await response.json();
      const replyText = (data as any).choices[0].message.content;

      return res.status(200).json({
        success: true,
        reply: replyText,
        sensorContext: { heartRate, stressScore, mws, pregnancyWeek },
      });
    } catch (err: any) {
      console.error('Chatbot error:', err.message);
      return res.status(500).json({ success: false, error: 'Failed to get AI response.' });
    }
  }
}
