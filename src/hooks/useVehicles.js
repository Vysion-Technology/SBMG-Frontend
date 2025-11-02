import { useQuery } from '@tanstack/react-query';
import { vehiclesAPI } from '../services/api';

/**
 * Custom hook to fetch vehicles based on location
 * @param {Object} location - Location parameters
 * @param {number} location.districtId - District ID
 * @param {number} location.blockId - Block ID
 * @param {number} location.gpId - Gram Panchayat ID
 * @param {Object} options - Additional query options
 */
/**
 * Generate mock GPS coordinates for vehicles (Jodhpur area)
 * TODO: Replace with real GPS data from tracking device
 */
const generateMockCoordinates = (vehicleId) => {
  // Base coordinates around Jodhpur, Rajasthan
  const baseLatitude = 26.2389;
  const baseLongitude = 73.0243;
  
  // Add some randomness based on vehicle ID
  const latOffset = (vehicleId * 0.01) - 0.02;
  const lngOffset = (vehicleId * 0.015) - 0.03;
  
  return {
    lat: baseLatitude + latOffset,
    lng: baseLongitude + lngOffset
  };
};

/**
 * Generate mock status for vehicles
 * TODO: Replace with real status from GPS device
 */
const generateMockStatus = (vehicleId) => {
  const statuses = ['active', 'inactive', 'running', 'stopped'];
  return statuses[vehicleId % statuses.length];
};

export const useVehicles = (location = {}, options = {}) => {
  return useQuery({
    queryKey: ['vehicles', location.districtId, location.blockId, location.gpId],
    queryFn: async () => {
      const response = await vehiclesAPI.getVehiclesByLocation({
        district_id: location.districtId,
        block_id: location.blockId,
        gp_id: location.gpId,
      });
      
      // Backend returns: [{vehicle_no, imei, id, gp_id}]
      const vehicles = response.data || [];
      
      // Add mock GPS data to each vehicle
      return vehicles.map(vehicle => ({
        ...vehicle,
        vehicle_id: vehicle.id,
        vehicle_name: `Vehicle ${vehicle.vehicle_no}`,
        status: generateMockStatus(vehicle.id),
        speed: Math.floor(Math.random() * 60), // Mock speed 0-60 km/h
        coordinates: generateMockCoordinates(vehicle.id),
        last_updated: new Date().toISOString(),
        isFlagged: false, // No flagged vehicles for now
        // Optional: Add mock route for moving vehicles
        route: generateMockStatus(vehicle.id) === 'running' ? [
          generateMockCoordinates(vehicle.id),
          {
            lat: generateMockCoordinates(vehicle.id).lat + 0.005,
            lng: generateMockCoordinates(vehicle.id).lng + 0.005,
          }
        ] : []
      }));
    },
    enabled: !!(location.districtId || location.blockId || location.gpId), // Only fetch if location is provided
    ...options,
  });
};

/**
 * Filter vehicles based on status
 * @param {Array} vehicles - Array of vehicles
 * @param {string} status - Status to filter by (all, active, running, stopped, inactive)
 */
export const filterVehiclesByStatus = (vehicles, status) => {
  if (!vehicles || !Array.isArray(vehicles)) return [];
  
  const statusLower = status.toLowerCase();
  
  if (statusLower === 'all' || statusLower.startsWith('all(')) {
    return vehicles;
  }
  
  // Extract status from tab format like "Active(01)"
  const extractedStatus = statusLower.replace(/\(.*\)/, '').trim();
  
  return vehicles.filter(vehicle => {
    const vehicleStatus = vehicle.status?.toLowerCase();
    return vehicleStatus === extractedStatus;
  });
};

/**
 * Filter vehicles based on search query
 * @param {Array} vehicles - Array of vehicles
 * @param {string} query - Search query
 */
export const searchVehicles = (vehicles, query) => {
  if (!vehicles || !Array.isArray(vehicles)) return [];
  if (!query || query.trim() === '') return vehicles;
  
  const searchLower = query.toLowerCase().trim();
  
  return vehicles.filter(vehicle => {
    return (
      vehicle.vehicle_no?.toLowerCase().includes(searchLower) ||
      vehicle.vehicle_name?.toLowerCase().includes(searchLower) ||
      vehicle.vehicle_number?.toLowerCase().includes(searchLower)
    );
  });
};

