import { GoogleMap, Marker, Polyline } from '@react-google-maps/api';
import { Loader } from 'lucide-react';
import { useGoogleMaps } from '../../../context/GoogleMapsProvider'; // Provider approach

const containerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 26.2389, lng: 73.0243 };
const mapOptions = { zoomControl: true, streetViewControl: false, mapTypeControl: false, fullscreenControl: true };

const getMarkerIcon = (status) => {
  const colors = { running: '#3b82f6', stopped: '#ef4444', active: '#22c55e', inactive: '#9ca3af' };
  const color = colors[status?.toLowerCase()] || colors.inactive;
  const svgMarker = `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="3"/>
      <path d="M12 18h6v-4h4v4h4l-7 7-7-7z" fill="white"/>
    </svg>`;
  return { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgMarker)}`, scaledSize: new window.google.maps.Size(40, 40), anchor: new window.google.maps.Point(20, 20) };
};

const GoogleMapView = ({ vehicles = [], selectedVehicle, onVehicleSelect, center, zoom = 13 }) => {
  const { isLoaded, loadError } = useGoogleMaps();

  if (loadError) return <div style={{ padding: 20, color: '#ef4444' }}>Error loading Google Maps: {loadError.message}</div>;
  if (!isLoaded) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Loader style={{ width: 48, height: 48 }} /></div>;

  const mapCenter = center || selectedVehicle?.coordinates || vehicles.find(v => v.coordinates)?.coordinates || defaultCenter;

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={mapCenter} zoom={zoom} options={mapOptions}>
      {/* Vehicle markers */}
      {vehicles.map(vehicle => vehicle.coordinates && (
        <Marker
          key={vehicle.vehicle_id || vehicle.id}
          position={vehicle.coordinates}
          icon={getMarkerIcon(vehicle.status)}
          onClick={() => onVehicleSelect(vehicle)}
          title={vehicle.vehicle_no || vehicle.vehicle_number || 'Unknown'}
          animation={selectedVehicle?.vehicle_id === vehicle.vehicle_id ? window.google.maps.Animation.BOUNCE : null}
        />
      ))}

      {/* Vehicle routes */}
      {vehicles.map(vehicle => vehicle.route?.length >= 2 && (
        <Polyline
          key={`route-${vehicle.vehicle_id || vehicle.id}`}
          path={vehicle.route.filter(p => p.lat && p.lng)}
          options={{ strokeColor: '#3b82f6', strokeOpacity: 0.8, strokeWeight: 4 }}
        />
      ))}
    </GoogleMap>
  );
};

export default GoogleMapView;