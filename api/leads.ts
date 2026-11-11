// Vercel Serverless Function handler for /api/leads
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { name, email, businessName, businessType, locationsCount, estimatedMonthlySpend, reviewMethod, message } = body;

    if (!name || !email || !businessName) {
      return res.status(400).json({ error: 'Name, email, and business name are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid work email address.' });
    }

    const leadId = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // In a serverless environment, log the lead data for auditing
    console.log('[PriceGuard Lead Received]', {
      leadId,
      name,
      email,
      businessName,
      businessType: businessType || 'Restaurant',
      locationsCount: locationsCount || '1',
      estimatedMonthlySpend: estimatedMonthlySpend || 'Not specified',
      reviewMethod: reviewMethod || 'Not specified',
      message: message || '',
      receivedAt: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      leadId,
      message: 'Thank you. Your request for an invoice review has been received.'
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error processing lead submission.' });
  }
}
