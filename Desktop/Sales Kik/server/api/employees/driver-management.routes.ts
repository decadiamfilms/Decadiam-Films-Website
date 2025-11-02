import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all employees with their driver status
router.get('/', async (req, res) => {
  try {
    const companyId = req.body.companyId || '0e573687-3b53-498a-9e78-f198f16f8bcb';

    const employees = await prisma.user.findMany({
      where: {
        company_id: companyId,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        isDriver: true,
        driverLicenseNumber: true,
        driverLicenseClass: true,
        driverLicenseExpiry: true,
        driverPhone: true,
        driverStatus: true,
        created_at: true,
        lastLogin: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Transform for frontend
    const transformedEmployees = employees.map(employee => ({
      id: employee.id,
      name: employee.name,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      role: employee.role,
      isActive: true,
      isDriver: employee.isDriver,
      driverInfo: employee.isDriver ? {
        licenseNumber: employee.driverLicenseNumber,
        licenseClass: employee.driverLicenseClass,
        licenseExpiry: employee.driverLicenseExpiry,
        phone: employee.driverPhone,
        status: employee.driverStatus
      } : null,
      lastLogin: employee.lastLogin
    }));

    console.log(`👥 Employee Driver API: Found ${employees.length} employees, ${employees.filter(e => e.isDriver).length} are drivers`);

    res.json({
      success: true,
      data: transformedEmployees
    });

  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch employees'
    });
  }
});

// Assign driver capabilities to an employee
router.post('/:employeeId/assign-driver', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const {
      licenseNumber,
      licenseClass,
      licenseExpiry,
      phone
    } = req.body;

    // Check if license number is already in use
    const existingDriver = await prisma.user.findFirst({
      where: {
        driverLicenseNumber: licenseNumber.toUpperCase(),
        id: { not: employeeId }
      }
    });

    if (existingDriver) {
      return res.status(400).json({
        success: false,
        error: 'This license number is already assigned to another employee'
      });
    }

    // Update employee with driver capabilities
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

    console.log(`🚛 Employee ${employee.name} assigned as driver with license ${licenseNumber}`);

    // Trigger backup
    const backupService = await import('../../services/backup.service');
    await backupService.default.backupCompanyData(employee.company_id);

    res.json({
      success: true,
      data: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        isDriver: employee.isDriver,
        driverInfo: {
          licenseNumber: employee.driverLicenseNumber,
          licenseClass: employee.driverLicenseClass,
          licenseExpiry: employee.driverLicenseExpiry,
          phone: employee.driverPhone,
          status: employee.driverStatus
        }
      }
    });

  } catch (error) {
    console.error('Error assigning driver to employee:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign driver capabilities'
    });
  }
});

// Remove driver capabilities from an employee
router.delete('/:employeeId/remove-driver', async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await prisma.user.update({
      where: { id: employeeId },
      data: {
        isDriver: false,
        driverLicenseNumber: null,
        driverLicenseClass: null,
        driverLicenseExpiry: null,
        driverPhone: null,
        driverStatus: null
      }
    });

    console.log(`🚫 Driver capabilities removed from employee ${employee.name}`);

    // Trigger backup
    const backupService = await import('../../services/backup.service');
    await backupService.default.backupCompanyData(employee.company_id);

    res.json({
      success: true,
      message: 'Driver capabilities removed successfully'
    });

  } catch (error) {
    console.error('Error removing driver capabilities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove driver capabilities'
    });
  }
});

// Update driver status for an employee
router.put('/:employeeId/driver-status', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status } = req.body;

    const validStatuses = ['AVAILABLE', 'ON_DELIVERY', 'OFF_DUTY', 'UNAVAILABLE'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid driver status'
      });
    }

    const employee = await prisma.user.update({
      where: { 
        id: employeeId,
        isDriver: true // Only update if employee is a driver
      },
      data: {
        driverStatus: status
      }
    });

    console.log(`🔄 Driver status updated for ${employee.name}: ${status}`);

    res.json({
      success: true,
      data: {
        id: employee.id,
        name: employee.name,
        driverStatus: employee.driverStatus
      }
    });

  } catch (error) {
    console.error('Error updating driver status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update driver status'
    });
  }
});

// Get available drivers (employees who can drive and are available)
router.get('/available-drivers', async (req, res) => {
  try {
    const companyId = req.body.companyId || '0e573687-3b53-498a-9e78-f198f16f8bcb';

    const availableDrivers = await prisma.user.findMany({
      where: {
        company_id: companyId,
        isActive: true,
        isDriver: true,
        driverStatus: 'AVAILABLE'
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        driverLicenseNumber: true,
        driverLicenseClass: true,
        driverPhone: true,
        driverStatus: true
      }
    });

    console.log(`🚚 Available Drivers API: Found ${availableDrivers.length} available employee-drivers`);

    res.json({
      success: true,
      data: availableDrivers
    });

  } catch (error) {
    console.error('Error fetching available drivers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available drivers'
    });
  }
});

export default router;