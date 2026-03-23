import React, { createContext, useContext, useMemo } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

const GoogleMapsContext = createContext();

export const GoogleMapsProvider = ({ children }) => {
    const loaderOptions = useMemo(() => ({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: ['places', 'geometry'], // ✅ single source of truth
        language: 'en',
        region: 'US',
    }), []);

    const { isLoaded, loadError } = useJsApiLoader(loaderOptions);

    return (
        <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
            {children}
        </GoogleMapsContext.Provider>
    );
};

export const useGoogleMaps = () => useContext(GoogleMapsContext);