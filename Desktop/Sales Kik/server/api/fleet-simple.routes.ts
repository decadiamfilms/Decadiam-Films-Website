import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get vehicles - SAFE version
router.get('/vehicles', async (req, res) => {
  try {
    const companyId = '0e573687-3b53-498a-9e78-f198f16f8bcb';
    
    const vehicles = await prisma.vehicle.findMany({
      where: {
        company_id: companyId,
        is_active: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`🚛 Safe Fleet API: Found ${vehicles.length} vehicles`);

    res.json({
      success: true,
      data: vehicles,
      count: vehicles.length
    });

  } catch (error) {
    console.error('Fleet API error:', error);
    res.json({
      success: true,
      data: [],
      count: 0,
      note: 'No vehicles found'
    });
  }
});

// Add vehicle - SAFE version
router.post('/vehicles', async (req, res) => {
  try {
    const companyId = '0e573687-3b53-498a-9e78-f198f16f8bcb';
    const data = req.body;

    // Validate required fields
    if (!data.registration) {
      return res.status(400).json({
        success: false,
        error: 'Registration number is required'
      });
    }

    // Check for existing registration
    const existing = await prisma.vehicle.findUnique({
      where: { registration: data.registration.toUpperCase() }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: `Vehicle ${data.registration} already exists`
      });
    }

    // Create vehicle with safe defaults
    const vehicleData = {
      company_id: companyId,
      registration: data.registration.toUpperCase(),
      make: data.make || 'Unknown',
      model: data.model || 'Unknown',
      year: data.year ? parseInt(data.year.toString()) : null,
      type: data.type || 'CAR',
      max_weight: data.maxWeight && data.maxWeight !== '' ? parseFloat(data.maxWeight.toString()) : null,
      max_volume: data.maxVolume && data.maxVolume !== '' ? parseFloat(data.maxVolume.toString()) : null,
      fuel_type: data.fuelType || 'PETROL',
      odometer_reading: data.odometerReading ? parseInt(data.odometerReading.toString()) : 0,
      status: 'AVAILABLE',
      is_active: true
    };

    const vehicle = await prisma.vehicle.create({
      data: vehicleData
    });

    console.log(`✅ SAFE: Vehicle created - ${vehicle.registration} (${vehicle.make} ${vehicle.model})`);

    res.json({
      success: true,
      data: vehicle,
      message: `Vehicle ${vehicle.registration} added to database successfully`
    });

  } catch (error) {
    console.error('Safe vehicle creation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Database error occurred',
      details: 'Vehicle creation failed - database preserved'
    });
  }
});

// Employee drivers - SAFE version
router.get('/employee-drivers', async (req, res) => {
  try {
    const companyId = '0e573687-3b53-498a-9e78-f198f16f8bcb';

    const employees = await prisma.user.findMany({
      where: {
        company_id: companyId,
        isActive: true,
        isDriver: true
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isDriver: true,
        driverLicenseNumber: true,
        driverLicenseClass: true,
        driverLicenseExpiry: true,
        driverPhone: true,
        driverStatus: true
      }
    });

    console.log(`👨‍💼 Safe Employee Drivers: Found ${employees.length} employee-drivers`);

    res.json({
      success: true,
      data: employees,
      count: employees.length
    });

  } catch (error) {
    console.error('Safe employee drivers error:', error);
    res.json({
      success: true,
      data: [],
      count: 0,
      note: 'No employee-drivers found'
    });
  }
});

export default router;