import axios from 'axios';

interface LocationCoordinates {
  lat: number;
  lng: number;
  address?: string;
}

interface RouteWaypoint {
  location: LocationCoordinates;
  stopover: boolean;
  unloadingTime?: number; // minutes
}

interface OptimizedRoute {
  waypoints: RouteWaypoint[];
  totalDistance: number; // km
  totalDuration: number; // minutes
  routeLegs: RouteLeg[];
  optimizedOrder: number[];
}

interface RouteLeg {
  startLocation: LocationCoordinates;
  endLocation: LocationCoordinates;
  distance: number; // km
  duration: number; // minutes
  trafficDuration?: number; // minutes with traffic
}

interface DeliveryTimeCalculation {
  departureTime: Date;
  arrivalTime: Date;
  unloadingEndTime: Date;
  nextDepartureTime?: Date;
}

class RouteOptimizationService {
  private readonly GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  private readonly BASE_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';
  
  constructor() {
    if (!this.GOOGLE_MAPS_API_KEY) {
      console.warn('⚠️ Google Maps API key not configured - using mock data for development');
    }
  }

  /**
   * Optimize route for multiple delivery stops using Google Routes API
   */
  async optimizeRoute(
    startingPoint: LocationCoordinates,
    deliveryStops: Array<{
      location: LocationCoordinates;
      timeWindow?: { start: Date; end: Date };
      unloadingTime: number;
      priority?: number;
    }>,
    vehicleType: 'TRUCK' | 'VAN' | 'UTE' = 'TRUCK'
  ): Promise<OptimizedRoute> {
    
    if (!this.GOOGLE_MAPS_API_KEY) {
      return this.generateMockOptimizedRoute(startingPoint, deliveryStops);
    }

    try {
      // Build waypoints for Google Routes API
      const waypoints = deliveryStops.map((stop, index) => ({
        location: {
          latLng: {
            latitude: stop.location.lat,
            longitude: stop.location.lng
          }
        },
        via: false, // These are actual stops, not via points
        vehicleStopover: true
      }));

      const requestBody = {
        origin: {
          location: {
            latLng: {
              latitude: startingPoint.lat,
              longitude: startingPoint.lng
            }
          }
        },
        destination: {
          location: {
            latLng: {
              latitude: startingPoint.lat, // Return to start point
              longitude: startingPoint.lng
            }
          }
        },
        intermediates: waypoints,
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        optimizeWaypointOrder: true, // Let Google optimize the order
        units: 'METRIC',
        requestedReferenceTime: new Date().toISOString(),
        computeAlternativeRoutes: false,
        extraComputations: ['TRAFFIC_ON_POLYLINE', 'HTML_FORMATTED_NAVIGATION_INSTRUCTIONS']
      };

      const response = await axios.post(this.BASE_URL, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.optimizedIntermediateWaypointIndex,routes.legs'
        }
      });

      return this.parseGoogleRoutesResponse(response.data, deliveryStops);
      
    } catch (error) {
      console.error('Google Routes API error:', error);
      // Fallback to mock data if API fails
      return this.generateMockOptimizedRoute(startingPoint, deliveryStops);
    }
  }

  /**
   * Calculate delivery times based on route optimization
   */
  calculateDeliverySchedule(
    route: OptimizedRoute,
    startTime: Date,
    bufferTime: number = 15 // minutes buffer between stops
  ): DeliveryTimeCalculation[] {
    const schedule: DeliveryTimeCalculation[] = [];
    let currentTime = new Date(startTime);

    route.routeLegs.forEach((leg, index) => {
      // Calculate arrival time at this stop
      const travelTime = leg.trafficDuration || leg.duration;
      const arrivalTime = new Date(currentTime.getTime() + (travelTime * 60 * 1000));
      
      // Calculate unloading end time
      const unloadingTime = route.waypoints[index]?.unloadingTime || 30; // default 30 minutes
      const unloadingEndTime = new Date(arrivalTime.getTime() + (unloadingTime * 60 * 1000));
      
      // Calculate next departure time (with buffer)
      const nextDepartureTime = new Date(unloadingEndTime.getTime() + (bufferTime * 60 * 1000));

      schedule.push({
        departureTime: currentTime,
        arrivalTime,
        unloadingEndTime,
        nextDepartureTime: index < route.routeLegs.length - 1 ? nextDepartureTime : undefined
      });

      // Update current time for next leg
      currentTime = nextDepartureTime;
    });

    return schedule;
  }

  /**
   * Get distance and duration between two points
   */
  async getDistanceAndDuration(
    origin: LocationCoordinates,
    destination: LocationCoordinates
  ): Promise<{ distance: number; duration: number; trafficDuration?: number }> {
    
    if (!this.GOOGLE_MAPS_API_KEY) {
      return this.getMockDistanceAndDuration(origin, destination);
    }

    try {
      const requestBody = {
        origin: {
          location: {
            latLng: {
              latitude: origin.lat,
              longitude: origin.lng
            }
          }
        },
        destination: {
          location: {
            latLng: {
              latitude: destination.lat,
              longitude: destination.lng
            }
          }
        },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        requestedReferenceTime: new Date().toISOString()
      };

      const response = await axios.post(this.BASE_URL, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.legs.duration,routes.legs.staticDuration'
        }
      });

      const route = response.data.routes[0];
      return {
        distance: route.distanceMeters / 1000, // Convert to km
        duration: parseInt(route.duration.replace('s', '')) / 60, // Convert to minutes
        trafficDuration: route.legs[0]?.duration ? parseInt(route.legs[0].duration.replace('s', '')) / 60 : undefined
      };

    } catch (error) {
      console.error('Google Distance API error:', error);
      return this.getMockDistanceAndDuration(origin, destination);
    }
  }

  /**
   * Generate mock optimized route for development/fallback
   */
  private generateMockOptimizedRoute(
    startingPoint: LocationCoordinates,
    deliveryStops: Array<{
      location: LocationCoordinates;
      timeWindow?: { start: Date; end: Date };
      unloadingTime: number;
    }>
  ): OptimizedRoute {
    // Simple distance-based optimization for mock data
    const optimizedOrder = deliveryStops
      .map((stop, index) => ({
        index,
        distance: this.calculateHaversineDistance(startingPoint, stop.location)
      }))
      .sort((a, b) => a.distance - b.distance)
      .map(item => item.index);

    const waypoints: RouteWaypoint[] = optimizedOrder.map(index => ({
      location: deliveryStops[index].location,
      stopover: true,
      unloadingTime: deliveryStops[index].unloadingTime
    }));

    const routeLegs: RouteLeg[] = [];
    let currentLocation = startingPoint;
    let totalDistance = 0;
    let totalDuration = 0;

    // Calculate route legs
    for (const waypointIndex of optimizedOrder) {
      const destination = deliveryStops[waypointIndex].location;
      const distance = this.calculateHaversineDistance(currentLocation, destination);
      const duration = distance * 2; // Assume 30km/h average speed in city
      
      routeLegs.push({
        startLocation: currentLocation,
        endLocation: destination,
        distance,
        duration,
        trafficDuration: duration * 1.2 // Add 20% for traffic
      });

      totalDistance += distance;
      totalDuration += duration;
      currentLocation = destination;
    }

    return {
      waypoints,
      totalDistance,
      totalDuration,
      routeLegs,
      optimizedOrder
    };
  }

  /**
   * Mock distance and duration calculation
   */
  private getMockDistanceAndDuration(
    origin: LocationCoordinates,
    destination: LocationCoordinates
  ): { distance: number; duration: number; trafficDuration: number } {
    const distance = this.calculateHaversineDistance(origin, destination);
    const duration = distance * 2; // 30km/h average
    const trafficDuration = duration * 1.2; // 20% traffic delay
    
    return { distance, duration, trafficDuration };
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateHaversineDistance(
    point1: LocationCoordinates,
    point2: LocationCoordinates
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Parse Google Routes API response
   */
  private parseGoogleRoutesResponse(data: any, originalStops: any[]): OptimizedRoute {
    const route = data.routes[0];
    
    if (!route) {
      throw new Error('No routes found in Google API response');
    }

    // Extract optimized waypoint order
    const optimizedOrder = route.optimizedIntermediateWaypointIndex || 
                          originalStops.map((_, index) => index);

    // Build waypoints in optimized order
    const waypoints: RouteWaypoint[] = optimizedOrder.map((index: number) => ({
      location: originalStops[index].location,
      stopover: true,
      unloadingTime: originalStops[index].unloadingTime
    }));

    // Parse route legs
    const routeLegs: RouteLeg[] = route.legs.map((leg: any) => ({
      startLocation: {
        lat: leg.startLocation.latLng.latitude,
        lng: leg.startLocation.latLng.longitude
      },
      endLocation: {
        lat: leg.endLocation.latLng.latitude,
        lng: leg.endLocation.latLng.longitude
      },
      distance: leg.distanceMeters / 1000, // Convert to km
      duration: parseInt(leg.duration.replace('s', '')) / 60, // Convert to minutes
      trafficDuration: leg.staticDuration ? parseInt(leg.staticDuration.replace('s', '')) / 60 : undefined
    }));

    return {
      waypoints,
      totalDistance: route.distanceMeters / 1000,
      totalDuration: parseInt(route.duration.replace('s', '')) / 60,
      routeLegs,
      optimizedOrder
    };
  }

  /**
   * Suggest optimal truck assignment based on capacity and route distance
   */
  suggestTruckAssignment(
    deliveryItems: Array<{
      weight: number;
      volume: number;
      quantity: number;
    }>,
    availableVehicles: Array<{
      id: string;
      registration: string;
      type: string;
      maxWeight: number;
      maxVolume: number;
      currentLocation?: LocationCoordinates;
    }>,
    startLocation: LocationCoordinates
  ): {
    recommendedVehicle: any;
    utilizationPercentage: number;
    alternativeVehicles: any[];
    reasoning: string;
  } {
    // Calculate total delivery requirements
    const totalWeight = deliveryItems.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
    const totalVolume = deliveryItems.reduce((sum, item) => sum + (item.volume * item.quantity), 0);

    // Score vehicles based on capacity utilization and location
    const vehicleScores = availableVehicles.map(vehicle => {
      const weightUtilization = totalWeight / vehicle.maxWeight;
      const volumeUtilization = totalVolume / vehicle.maxVolume;
      const maxUtilization = Math.max(weightUtilization, volumeUtilization);

      // Can't fit if over capacity
      if (maxUtilization > 1) {
        return { vehicle, score: -1, utilization: maxUtilization, reasoning: 'Exceeds capacity' };
      }

      // Calculate distance from current location to start
      let locationScore = 1; // Default if no location data
      if (vehicle.currentLocation) {
        const distance = this.calculateHaversineDistance(vehicle.currentLocation, startLocation);
        locationScore = Math.max(0.1, 1 - (distance / 50)); // Closer is better, max 50km penalty
      }

      // Optimal utilization is around 80-90%
      const utilizationScore = maxUtilization < 0.5 ? maxUtilization : // Under 50% is proportional
                              maxUtilization < 0.9 ? 0.8 + (maxUtilization - 0.5) * 0.5 : // 50-90% is good
                              1 - (maxUtilization - 0.9) * 2; // Over 90% gets penalized

      const finalScore = (utilizationScore * 0.7) + (locationScore * 0.3);
      
      return {
        vehicle,
        score: finalScore,
        utilization: maxUtilization,
        reasoning: `${Math.round(maxUtilization * 100)}% capacity utilization, ${vehicle.currentLocation ? 'good' : 'unknown'} location`
      };
    });

    // Sort by score (highest first)
    vehicleScores.sort((a, b) => b.score - a.score);
    
    // Filter out vehicles that can't handle the load
    const viableVehicles = vehicleScores.filter(vs => vs.score >= 0);
    
    if (viableVehicles.length === 0) {
      throw new Error('No vehicles available with sufficient capacity for this delivery');
    }

    const recommended = viableVehicles[0];
    const alternatives = viableVehicles.slice(1, 4); // Top 3 alternatives

    return {
      recommendedVehicle: recommended.vehicle,
      utilizationPercentage: Math.round(recommended.utilization * 100),
      alternativeVehicles: alternatives.map(alt => alt.vehicle),
      reasoning: `Best option: ${recommended.reasoning}. Distance optimized route with ${Math.round(recommended.utilization * 100)}% capacity utilization.`
    };
  }

  /**
   * Calculate when driver should leave to arrive at specific time
   */
  async calculateDepartureTime(
    origin: LocationCoordinates,
    destination: LocationCoordinates,
    targetArrivalTime: Date,
    bufferMinutes: number = 10
  ): Promise<{
    recommendedDepartureTime: Date;
    estimatedTravelTime: number;
    bufferTime: number;
    confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  }> {
    
    try {
      const routeData = await this.getDistanceAndDuration(origin, destination);
      const travelTime = routeData.trafficDuration || routeData.duration;
      const totalTime = travelTime + bufferMinutes;
      
      const departureTime = new Date(targetArrivalTime.getTime() - (totalTime * 60 * 1000));
      
      // Determine confidence level based on traffic data availability
      const confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 
        routeData.trafficDuration ? 'HIGH' :
        this.GOOGLE_MAPS_API_KEY ? 'MEDIUM' : 'LOW';

      return {
        recommendedDepartureTime: departureTime,
        estimatedTravelTime: travelTime,
        bufferTime: bufferMinutes,
        confidenceLevel
      };

    } catch (error) {
      console.error('Error calculating departure time:', error);
      
      // Fallback calculation
      const mockDistance = this.calculateHaversineDistance(origin, destination);
      const estimatedTravelTime = mockDistance * 2; // 30km/h average
      const totalTime = estimatedTravelTime + bufferMinutes;
      
      return {
        recommendedDepartureTime: new Date(targetArrivalTime.getTime() - (totalTime * 60 * 1000)),
        estimatedTravelTime,
        bufferTime: bufferMinutes,
        confidenceLevel: 'LOW'
      };
    }
  }

  /**
   * Get coordinates from address using Google Geocoding
   */
  async geocodeAddress(address: string): Promise<LocationCoordinates | null> {
    if (!this.GOOGLE_MAPS_API_KEY) {
      // Return mock coordinates for development
      return this.getMockCoordinatesForAddress(address);
    }

    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address,
          key: this.GOOGLE_MAPS_API_KEY,
          region: 'au' // Bias towards Australian addresses
        }
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
          address: response.data.results[0].formatted_address
        };
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Mock coordinates for development (Sydney area)
   */
  private getMockCoordinatesForAddress(address: string): LocationCoordinates {
    // Generate coordinates around Sydney for development
    const baseLat = -33.8688;
    const baseLng = 151.2093;
    const variance = 0.1; // ~10km variance
    
    // Use address string to generate consistent coordinates
    const hash = address.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const latOffset = ((hash % 1000) / 1000 - 0.5) * variance;
    const lngOffset = (((hash / 1000) % 1000) / 1000 - 0.5) * variance;
    
    return {
      lat: baseLat + latOffset,
      lng: baseLng + lngOffset,
      address
    };
  }
}

export default new RouteOptimizationService();