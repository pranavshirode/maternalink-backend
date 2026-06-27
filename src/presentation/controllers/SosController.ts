import { Request, Response } from 'express';
import twilio from 'twilio';

export class SosController {
  public static async activateSos(req: Request, res: Response) {
    try {
      const { userId, location } = req.body;

      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_FROM_NUMBER;
      const toNumber = process.env.EMERGENCY_CONTACT_NUMBER;

      if (!accountSid || !authToken || !fromNumber || !toNumber) {
        console.warn('Twilio environment variables not configured. Mocking SOS activation.');
        return res.status(200).json({
          success: true,
          message: 'SOS Activated (Mock Mode - Twilio not configured)',
          mocked: true,
        });
      }

      const client = twilio(accountSid, authToken);
      const messageBody = `🚨 MATERNALINK EMERGENCY SOS 🚨
An emergency SOS was activated.
User ID: ${userId || 'Unknown'}
Location: ${location || 'Unknown'}`;

      const message = await client.messages.create({
        body: messageBody,
        from: fromNumber,
        to: toNumber,
      });

      console.log(`SOS SMS sent with SID: ${message.sid}`);

      return res.status(200).json({
        success: true,
        message: 'SOS SMS sent successfully.',
        sid: message.sid,
        mocked: false,
      });
    } catch (err: any) {
      console.error('SOS Activation Error:', err.message);
      return res.status(500).json({ success: false, error: 'Failed to activate SOS.' });
    }
  }
}
