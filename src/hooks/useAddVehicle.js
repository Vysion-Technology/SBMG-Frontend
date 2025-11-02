import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiclesAPI } from '../services/api';

/**
 * Custom hook to add a new vehicle
 * @param {Object} options - Additional mutation options
 */
export const useAddVehicle = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vehicleData) => vehiclesAPI.addVehicle(vehicleData),
    onSuccess: (data, variables) => {
      // Invalidate and refetch vehicles queries
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      
      // Call custom onSuccess if provided
      if (options.onSuccess) {
        options.onSuccess(data, variables);
      }
    },
    onError: (error) => {
      console.error('Failed to add vehicle:', error);
      
      // Call custom onError if provided
      if (options.onError) {
        options.onError(error);
      }
    },
    ...options,
  });
};

/**
 * Custom hook to update a vehicle
 * @param {Object} options - Additional mutation options
 */
export const useUpdateVehicle = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vehicleId, vehicleData }) => 
      vehiclesAPI.updateVehicle(vehicleId, vehicleData),
    onSuccess: (data, variables) => {
      // Invalidate and refetch vehicles queries
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ 
        queryKey: ['vehicleDetails', variables.vehicleId] 
      });
      
      // Call custom onSuccess if provided
      if (options.onSuccess) {
        options.onSuccess(data, variables);
      }
    },
    onError: (error) => {
      console.error('Failed to update vehicle:', error);
      
      // Call custom onError if provided
      if (options.onError) {
        options.onError(error);
      }
    },
    ...options,
  });
};

/**
 * Custom hook to delete a vehicle
 * @param {Object} options - Additional mutation options
 */
export const useDeleteVehicle = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vehicleId) => vehiclesAPI.deleteVehicle(vehicleId),
    onSuccess: (data, vehicleId) => {
      // Invalidate and refetch vehicles queries
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ 
        queryKey: ['vehicleDetails', vehicleId] 
      });
      
      // Call custom onSuccess if provided
      if (options.onSuccess) {
        options.onSuccess(data, vehicleId);
      }
    },
    onError: (error) => {
      console.error('Failed to delete vehicle:', error);
      
      // Call custom onError if provided
      if (options.onError) {
        options.onError(error);
      }
    },
    ...options,
  });
};

