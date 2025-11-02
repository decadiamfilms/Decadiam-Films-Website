import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all vehicles for a company
router.get('/vehicles', async (req, res) => {
  try {
    const companyId = req.body.companyId || '0e573687-3b53-498a-9e78-f198f16f8bcb';

    const vehicles = await prisma.vehicle.findMany({
      where: {
        company_id: companyId,
        is_active: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`🚛 Fleet API: Found ${vehicles.length} vehicles for company ${companyId}`);

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
    const companyId = req.body.companyId || '0e573687-3b53-498a-9e78-f198f16f8bcb';
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

    // Check if registration already exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { registration }
    });

    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        error: 'A vehicle with this registration already exists'
      });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        company_id: companyId,
        registration: registration.toUpperCase(),
        make,
        model,
        year: year ? parseInt(year) : null,
        type: type || 'TRUCK',
        max_weight: maxWeight ? parseFloat(maxWeight) : null,
        max_volume: maxVolume ? parseFloat(maxVolume) : null,
        fuel_type: fuelType,
        odometer_reading: odometerReading ? parseInt(odometerReading) : 0,
        status: 'AVAILABLE'
      }
    });

    console.log(`✅ Vehicle created: ${vehicle.registration} (${vehicle.make} ${vehicle.model})`);

    // Backup will be added later when backup service is enhanced
    console.log('💾 Vehicle created - backup system will be enhanced later');
    
    res.json({
      success: true,
      data: vehicle
    });

  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create vehicle'
    });
  }
});

// Update vehicle
router.put('/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove undefined values
    const cleanData = Object.entries(updateData).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: cleanData
    });

    console.log(`🔧 Vehicle updated: ${vehicle.registration}`);

    // Trigger backup
    const companyId = vehicle.company_id;
    const backupService = await import('../../services/backup.service');
    await backupService.default.backupCompanyData(companyId);

    res.json({
      success: true,
      data: vehicle
    });

  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update vehicle'
    });
  }
});

// Delete vehicle
router.delete('/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: { is_active: false }
    });

    console.log(`🗑️ Vehicle deactivated: ${vehicle.registration}`);

    // Trigger backup
    const companyId = vehicle.company_id;
    const backupService = await import('../../services/backup.service');
    await backupService.default.backupCompanyData(companyId);

    res.json({
      success: true,
      message: 'Vehicle deactivated successfully'
    });

  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete vehicle'
    });
  }
});

// Get all drivers for a company
router.get('/drivers', async (req, res) => {
  try {
    const companyId = req.body.companyId || '0e573687-3b53-498a-9e78-f198f16f8bcb';

    const drivers = await prisma.driver.findMany({
      where: {
        company_id: companyId,
        is_active: true
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`👨‍💼 Fleet API: Found ${drivers.length} drivers for company ${companyId}`);

    res.json({
      success: true,
      data: drivers
    });

  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch drivers'
    });
  }
});

// Add new driver
router.post('/drivers', async (req, res) => {
  try {
    const companyId = req.body.companyId || '0e573687-3b53-498a-9e78-f198f16f8bcb';
    const {
      userId,  // Optional: link to existing employee/user
      firstName,
      lastName,
      licenseNumber,
      licenseClass,
      licenseExpiry,
      phone,
      email
    } = req.body;

    // Check if license number already exists
    const existingDriver = await prisma.driver.findUnique({
      where: { license_number: licenseNumber }
    });

    if (existingDriver) {
      return res.status(400).json({
        success: false,
        error: 'A driver with this license number already exists'
      });
    }

    const driver = await prisma.driver.create({
      data: {
        company_id: companyId,
        user_id: userId || null, // Link to employee if provided
        first_name: firstName,
        last_name: lastName,
        license_number: licenseNumber.toUpperCase(),
        license_class: licenseClass,
        license_expiry: new Date(licenseExpiry),
        phone,
        email,
        status: 'AVAILABLE'
      }
    });

    console.log(`✅ Driver created: ${driver.first_name} ${driver.last_name} (${driver.license_number})`);

    // Backup will be added later when backup service is enhanced
    console.log('💾 Vehicle created - backup system will be enhanced later');
    
    res.json({
      success: true,
      data: driver
    });

  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create driver'
    });
  }
});

// Update driver
router.put('/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Clean and transform data
    const cleanData: any = {};
    
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Convert camelCase to snake_case for database fields
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        if (dbKey === 'license_expiry' && typeof value === 'string') {
          cleanData[dbKey] = new Date(value);
        } else {
          cleanData[dbKey] = value;
        }
      }
    });

    const driver = await prisma.driver.update({
      where: { id },
      data: cleanData
    });

    console.log(`🔧 Driver updated: ${driver.first_name} ${driver.last_name}`);

    // Trigger backup
    const companyId = driver.company_id;
    const backupService = await import('../../services/backup.service');
    await backupService.default.backupCompanyData(companyId);

    res.json({
      success: true,
      data: driver
    });

  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update driver'
    });
  }
});

// Delete driver
router.delete('/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await prisma.driver.update({
      where: { id },
      data: { is_active: false }
    });

    console.log(`🗑️ Driver deactivated: ${driver.first_name} ${driver.last_name}`);

    // Trigger backup
    const companyId = driver.company_id;
    const backupService = await import('../../services/backup.service');
    await backupService.default.backupCompanyData(companyId);

    res.json({
      success: true,
      message: 'Driver deactivated successfully'
    });

  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete driver'
    });
  }
});

// Get fleet summary statistics
router.get('/summary', async (req, res) => {
  try {
    const companyId = req.body.companyId || '0e573687-3b53-498a-9e78-f198f16f8bcb';

    // Get vehicle statistics
    const vehicleStats = await prisma.vehicle.groupBy({
      by: ['status'],
      where: {
        company_id: companyId,
        is_active: true
      },
      _count: {
        status: true
      }
    });

    // Get driver statistics
    const driverStats = await prisma.driver.groupBy({
      by: ['status'],
      where: {
        company_id: companyId,
        is_active: true
      },
      _count: {
        status: true
      }
    });

    // Get capacity totals
    const capacityData = await prisma.vehicle.aggregate({
      where: {
        company_id: companyId,
        is_active: true,
        status: {
          in: ['AVAILABLE', 'IN_USE']
        }
      },
      _sum: {
        max_weight: true,
        max_volume: true
      },
      _count: {
        id: true
      }
    });

    res.json({
      success: true,
      data: {
        vehicles: vehicleStats,
        drivers: driverStats,
        capacity: {
          totalVehicles: capacityData._count.id,
          totalWeight: capacityData._sum.max_weight || 0,
          totalVolume: capacityData._sum.max_volume || 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching fleet summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fleet summary'
    });
  }
});

export default router;