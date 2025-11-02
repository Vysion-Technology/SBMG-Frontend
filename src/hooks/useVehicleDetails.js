import { useQuery } from '@tanstack/react-query';
import { vehiclesAPI } from '../services/api';

/**
 * Custom hook to fetch vehicle details
 * @param {string} vehicleId - Vehicle ID
 * @param {Object} params - Query parameters
 * @param {number} params.month - Month (1-12)
 * @param {number} params.year - Year
 * @param {Object} options - Additional query options
 */
export const useVehicleDetails = (vehicleId, params = {}, options = {}) => {
  const currentDate = new Date();
  const month = params.month || (currentDate.getMonth() + 1);
  const year = params.year || currentDate.getFullYear();

  return useQuery({
    queryKey: ['vehicleDetails', vehicleId, month, year],
    queryFn: async () => {
      const response = await vehiclesAPI.getVehicleDetails(vehicleId, {
        month,
        year,
      });
      
      return response.data;
    },
    enabled: !!vehicleId, // Only fetch if vehicleId is provided
    ...options,
  });
};

