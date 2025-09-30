import express from 'express';

const router = express.Router();

// Enterprise contact form submission
router.post('/contact', async (req, res) => {
  try {
    const {
      companyName,
      fullName,
      email,
      phone,
      numberOfLocations,
      numberOfUsers,
      currentSoftware,
      requirements,
      selectedPlan,
      timestamp
    } = req.body;

    // Validate required fields
    if (!companyName || !fullName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: companyName, fullName, email, phone'
      });
    }

    // Log the enterprise inquiry (in production, save to database)
    console.log('Enterprise contact form submitted:', {
      companyName,
      fullName,
      email,
      phone,
      numberOfLocations,
      numberOfUsers,
      currentSoftware,
      requirements,
      timestamp: timestamp || new Date().toISOString()
    });

    // In production, you would:
    // 1. Save to database
    // 2. Send notification to sales team
    // 3. Send confirmation email to prospect
    // 4. Create lead in CRM system

    res.status(200).json({ 
      success: true, 
      message: 'Enterprise contact form submitted successfully',
      data: {
        contactId: `ENT-${Date.now()}`,
        submittedAt: new Date().toISOString(),
        status: 'pending_contact'
      }
    });

  } catch (error) {
    console.error('Enterprise contact form error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit enterprise contact form' 
    });
  }
});

export default router;