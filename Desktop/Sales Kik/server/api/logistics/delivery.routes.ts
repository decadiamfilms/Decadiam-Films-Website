import express from 'express';
import { PrismaClient } from '@prisma/client';
import routeOptimizationService from '../../services/route-optimization.service';
import deliveryNotificationService from '../../services/delivery-notifications.service';

const router = express.Router();
const prisma = new PrismaClient();

// Get all delivery runs for a company
router.get('/runs', async (req, res) => {
  try {
    const companyId = req.body.companyId || '0e573687-3b53-498a-9e78-f198f16f8bcb';
    const { date, status } = req.query;

    const whereClause: any = {
      company_id: companyId,
      is_active: true
    };

    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      whereClause.planned_date = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    if (status) {
      whereClause.status = status;
    }

    const deliveryRuns = await prisma.deliveryRun.findMany({
      where: whereClause,
      include: {
        driver: true,
        vehicle: true,
        deliveries: {
          include: {
            customer: true,
            order: true,
            quote: true
          },
          orderBy: {
            sequence_order: 'asc'
          }
        }
      },
      orderBy: {
        planned_date: 'desc'
      }
    });

    res.json({
      success: true,
      data: deliveryRuns
    });

  } catch (error) {
    console.error('Error fetching delivery runs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch delivery runs'
    });
  }
});

// Create new delivery run with route optimization
router.post('/runs', async (req, res) => {
  try {
    const companyId = req.body.companyId || '0e573687-3b53-498a-9e78-f198f16f8bcb';
    const {
      runName,
      plannedDate,
      vehicleId,
      driverId,
      startingLocation,
      deliveries
    } = req.body;

    // Generate run number
    const runCount = await prisma.deliveryRun.count({
      where: { company_id: companyId }
    });
    const runNumber = `DR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(runCount + 1).padStart(3, '0')}`;

    // Optimize route if multiple deliveries
    let optimizedRoute = null;
    let routeOptimizationData = null;

    if (deliveries.length > 1) {
      console.log('🗺️ Optimizing route for', deliveries.length, 'stops...');
      
      const deliveryStops = deliveries.map((delivery: any) => ({
        location: delivery.coordinates || {
          lat: -33.8688 + (Math.random() - 0.5) * 0.1,
          lng: 151.2093 + (Math.random() - 0.5) * 0.1
        },
        timeWindow: delivery.timeWindow,
        unloadingTime: delivery.unloadingTime || 30
      }));

      optimizedRoute = await routeOptimizationService.optimizeRoute(
        startingLocation,
        deliveryStops,
        'TRUCK'
      );

      routeOptimizationData = {
        input_stops: deliveryStops,
        optimized_sequence: optimizedRoute.optimizedOrder,
        estimated_distance: optimizedRoute.totalDistance,
        estimated_duration: optimizedRoute.totalDuration,
        algorithm_version: '1.0.0',
        processing_time: Date.now()
      };

      console.log('✅ Route optimization complete:', {
        totalDistance: optimizedRoute.totalDistance.toFixed(1) + 'km',
        totalDuration: Math.round(optimizedRoute.totalDuration) + 'min',
        optimizedOrder: optimizedRoute.optimizedOrder
      });
    }

    // Create delivery run
    const deliveryRun = await prisma.deliveryRun.create({
      data: {
        run_number: runNumber,
        run_name: runName,
        company_id: companyId,
        vehicle_id: vehicleId,
        driver_id: driverId,
        planned_date: new Date(plannedDate),
        starting_location: startingLocation,
        total_distance: optimizedRoute?.totalDistance || 0,
        total_stops: deliveries.length,
        estimated_duration: optimizedRoute?.totalDuration || 0,
        status: 'PLANNED',
        created_by: 'admin-001', // TODO: Get from auth
        optimized_route: optimizedRoute ? {
          waypoints: optimizedRoute.waypoints,
          routeLegs: optimizedRoute.routeLegs
        } as any : undefined
      }
    });

    // Create individual deliveries
    const createdDeliveries = [];
    for (let i = 0; i < deliveries.length; i++) {
      const delivery = deliveries[i];
      const sequenceOrder = optimizedRoute ? 
        optimizedRoute.optimizedOrder.indexOf(i) + 1 : i + 1;

      const deliveryNumber = `DEL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(i + 1).padStart(3, '0')}`;

      const createdDelivery = await prisma.delivery.create({
        data: {
          delivery_number: deliveryNumber,
          delivery_run_id: deliveryRun.id,
          customer_id: delivery.customerId,
          order_id: delivery.orderId || null,
          quote_id: delivery.quoteId || null,
          delivery_address: delivery.address,
          sequence_order: sequenceOrder,
          scheduled_time: delivery.scheduledTime ? new Date(delivery.scheduledTime) : null,
          time_window_start: delivery.timeWindow?.start ? new Date(delivery.timeWindow.start) : null,
          time_window_end: delivery.timeWindow?.end ? new Date(delivery.timeWindow.end) : null,
          unloading_time: delivery.unloadingTime || 30,
          special_instructions: delivery.specialInstructions,
          delivery_items: delivery.items || [],
          customer_phone: delivery.customerPhone,
          customer_email: delivery.customerEmail,
          notification_type: delivery.notificationType || 'EMAIL',
          status: 'PLANNED'
        }
      });

      createdDeliveries.push(createdDelivery);
    }

    // Store route optimization data if available
    if (routeOptimizationData) {
      await prisma.routeOptimization.create({
        data: {
          delivery_run_id: deliveryRun.id,
          input_stops: routeOptimizationData.input_stops,
          optimized_sequence: routeOptimizationData.optimized_sequence,
          estimated_distance: routeOptimizationData.estimated_distance,
          estimated_duration: routeOptimizationData.estimated_duration,
          algorithm_version: routeOptimizationData.algorithm_version
        }
      });
    }

    res.json({
      success: true,
      data: {
        deliveryRun,
        deliveries: createdDeliveries,
        optimization: routeOptimizationData
      }
    });

  } catch (error) {
    console.error('Error creating delivery run:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create delivery run'
    });
  }
});

// Calculate ETA for specific delivery
router.post('/calculate-eta', async (req, res) => {
  try {
    const { origin, destination, targetTime, bufferMinutes } = req.body;

    const etaCalculation = await routeOptimizationService.calculateDepartureTime(
      origin,
      destination,
      new Date(targetTime),
      bufferMinutes || 15
    );

    res.json({
      success: true,
      data: etaCalculation
    });

  } catch (error) {
    console.error('Error calculating ETA:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate ETA'
    });
  }
});

// Suggest truck assignment based on delivery requirements
router.post('/suggest-vehicle', async (req, res) => {
  try {
    const companyId = req.body.companyId || '0e573687-3b53-498a-9e78-f198f16f8bcb';
    const { deliveryItems, startLocation } = req.body;

    // Get available vehicles
    const availableVehicles = await prisma.vehicle.findMany({
      where: {
        company_id: companyId,
        status: 'AVAILABLE',
        is_active: true
      }
    });

    if (availableVehicles.length === 0) {
      return res.json({
        success: false,
        error: 'No vehicles available'
      });
    }

    // Transform vehicles to match service interface
    const transformedVehicles = availableVehicles.map(vehicle => ({
      id: vehicle.id,
      registration: vehicle.registration,
      type: vehicle.type,
      maxWeight: vehicle.max_weight || 1000,
      maxVolume: vehicle.max_volume || 10,
      currentLocation: vehicle.current_location as any
    }));

    const suggestion = routeOptimizationService.suggestTruckAssignment(
      deliveryItems,
      transformedVehicles,
      startLocation
    );

    res.json({
      success: true,
      data: suggestion
    });

  } catch (error) {
    console.error('Error suggesting vehicle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to suggest vehicle'
    });
  }
});

// Get available drivers and vehicles
router.get('/resources', async (req, res) => {
  try {
    const companyId = req.body.companyId || '0e573687-3b53-498a-9e78-f198f16f8bcb';
    const { date } = req.query;

    // Get available drivers
    const drivers = await prisma.driver.findMany({
      where: {
        company_id: companyId,
        status: 'AVAILABLE',
        is_active: true
      }
    });

    // Get available vehicles
    const vehicles = await prisma.vehicle.findMany({
      where: {
        company_id: companyId,
        status: 'AVAILABLE',
        is_active: true
      }
    });

    // Get pending orders/quotes that need delivery
    const pendingOrders = await prisma.order.findMany({
      where: {
        company_id: companyId,
        status: 'CONFIRMED'
      },
      include: {
        customer: true
      },
      take: 50 // Limit for performance
    });

    res.json({
      success: true,
      data: {
        drivers,
        vehicles,
        pendingOrders,
        summary: {
          availableDrivers: drivers.length,
          availableVehicles: vehicles.length,
          pendingDeliveries: pendingOrders.length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching delivery resources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch delivery resources'
    });
  }
});

// Geocode address to coordinates
router.post('/geocode', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required'
      });
    }

    const coordinates = await routeOptimizationService.geocodeAddress(address);

    if (!coordinates) {
      return res.json({
        success: false,
        error: 'Address not found'
      });
    }

    res.json({
      success: true,
      data: coordinates
    });

  } catch (error) {
    console.error('Error geocoding address:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to geocode address'
    });
  }
});

// Send delivery notification
router.post('/notifications/send', async (req, res) => {
  try {
    const { deliveryId, notificationType, type } = req.body;

    // Get delivery details
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        customer: true,
        delivery_run: {
          include: {
            driver: true,
            vehicle: true
          }
        }
      }
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: 'Delivery not found'
      });
    }

    const notificationData = {
      customerName: delivery.customer.name,
      driverName: `${delivery.delivery_run.driver.first_name} ${delivery.delivery_run.driver.last_name}`,
      vehicleRegistration: delivery.delivery_run.vehicle.registration,
      estimatedArrival: delivery.estimated_arrival || new Date(),
      deliveryAddress: typeof delivery.delivery_address === 'string' 
        ? delivery.delivery_address 
        : (delivery.delivery_address as any).street || 'Delivery Address',
      contactPhone: delivery.customer_phone || undefined,
      specialInstructions: delivery.special_instructions || undefined
    };

    const result = await deliveryNotificationService.sendDeliveryNotification(
      deliveryId,
      type,
      notificationType,
      notificationData
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification'
    });
  }
});

// Update delivery status (with automatic notifications)
router.put('/deliveries/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, location } = req.body;

    const result = await deliveryNotificationService.updateDeliveryStatusWithNotification(
      id,
      status,
      location
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update delivery status'
    });
  }
});

// Get notification history for a delivery
router.get('/deliveries/:id/notifications', async (req, res) => {
  try {
    const { id } = req.params;

    const notifications = await deliveryNotificationService.getNotificationHistory(id);

    res.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

export default router;