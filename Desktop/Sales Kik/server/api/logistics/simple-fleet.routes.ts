import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all vehicles
router.get('/vehicles', async (req, res) => {
  try {
    const companyId = '0e573687-3b53-498a-9e78-f198f16f8bcb'; // Use fixed company ID

    const vehicles = await prisma.vehicle.findMany({
      where: {
        company_id: companyId,
        is_active: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`🚛 Fleet API: Found ${vehicles.length} vehicles`);

    res.json({
      success: true,
      data: vehicles
    });

  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicles'
    });
  }
});

// Add new vehicle
router.post('/vehicles', async (req, res) => {
  try {
    const companyId = '0e573687-3b53-498a-9e78-f198f16f8bcb'; // Use fixed company ID
    const {
      registration,
      make,
      model,
      year,
      type,
      maxWeight,
      maxVolume,
      fuelType,
      odometerReading
    } = req.body;

    // Check if registration exists
    const existing = await prisma.vehicle.findUnique({
      where: { registration: registration.toUpperCase() }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Vehicle registration already exists'
      });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        company_id: companyId,
        registration: registration.toUpperCase(),
        make: make || 'Unknown',
        model: model || 'Unknown',
        year: year ? parseInt(year.toString()) : null,
        type: type || 'CAR',
        max_weight: maxWeight && maxWeight !== '' ? parseFloat(maxWeight.toString()) : null,
        max_volume: maxVolume && maxVolume !== '' ? parseFloat(maxVolume.toString()) : null,
        fuel_type: fuelType || 'PETROL',
        odometer_reading: odometerReading ? parseInt(odometerReading.toString()) : 0,
        status: 'AVAILABLE'
      }
    });

    console.log(`✅ Vehicle created: ${vehicle.registration} (${vehicle.make} ${vehicle.model})`);

    res.json({
      success: true,
      data: vehicle,
      message: `Vehicle ${vehicle.registration} added successfully`
    });

  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create vehicle'
    });
  }
});

// Get employees who are drivers
router.get('/employee-drivers', async (req, res) => {
  try {
    const companyId = '0e573687-3b53-498a-9e78-f198f16f8bcb'; // Use fixed company ID

    const employeeDrivers = await prisma.user.findMany({
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

    console.log(`👨‍💼 Employee Drivers: Found ${employeeDrivers.length} employee-drivers`);

    res.json({
      success: true,
      data: employeeDrivers
    });

  } catch (error) {
    console.error('Error fetching employee drivers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch employee drivers'
    });
  }
});

// Assign driver capabilities to employee
router.post('/assign-driver/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { licenseNumber, licenseClass, licenseExpiry, phone } = req.body;

    // Check if license is already in use
    const existing = await prisma.user.findFirst({
      where: {
        driverLicenseNumber: licenseNumber.toUpperCase(),
        id: { not: employeeId }
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'License number already in use'
      });
    }

    const employee = await prisma.user.update({
      where: { id: employeeId },
      data: {
        isDriver: true,
        driverLicenseNumber: licenseNumber.toUpperCase(),
        driverLicenseClass: licenseClass,
        driverLicenseExpiry: new Date(licenseExpiry),
        driverPhone: phone,
        driverStatus: 'AVAILABLE'
      }
    });

    console.log(`✅ Employee ${employee.name} assigned as driver`);

    res.json({
      success: true,
      data: employee,
      message: `${employee.name} assigned as driver successfully`
    });

  } catch (error) {
    console.error('Error assigning driver:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign driver'
    });
  }
});

export default router;