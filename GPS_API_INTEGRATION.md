# GPS Tracking - Backend API Integration Summary

## ✅ What's Implemented

The GPS tracking frontend is now integrated with your actual backend API endpoints.

### API Endpoints Used:

#### 1. Get Vehicles
```
GET /api/v1/gps/vehicles?district_id=1&block_id=1&gp_id=1
```

**Backend Response:**
```json
[
  {
    "vehicle_no": "UP91T4309",
    "imei": "357803372737250",
    "id": 1,
    "gp_id": 1
  }
]
```

**Frontend Enhancement:**
The frontend adds mock GPS data to each vehicle:
- `coordinates: { lat, lng }` - Mock location around Jodhpur
- `status` - Mock status (active/inactive/running/stopped)
- `speed` - Mock speed
- `route` - Mock route path for running vehicles

#### 2. Add Vehicle
```
POST /api/v1/gps/vehicles
```

**Request Body:**
```json
{
  "gp_id": 1,
  "vehicle_no": "UP91T4309",
  "imei": "357803372737250"
}
```

**Response:**
```json
{
  "vehicle_no": "UP91T4309",
  "imei": "357803372737250",
  "id": 4,
  "gp_id": 1
}
```

---

## 🗺️ How It Works

1. **User selects location** (District/Block/GP)
2. **Frontend calls** `GET /api/v1/gps/vehicles?gp_id=1`
3. **Backend returns** basic vehicle data (vehicle_no, imei, id, gp_id)
4. **Frontend adds** mock GPS coordinates and status
5. **Google Maps displays** vehicles as markers
6. **User can add** new vehicles via the modal

---

## 📍 Mock GPS Data (Temporary)

Currently using mock coordinates because backend doesn't provide GPS data yet:

```javascript
// Location: useVehicles.js
const generateMockCoordinates = (vehicleId) => {
  const baseLatitude = 26.2389;   // Jodhpur
  const baseLongitude = 73.0243;
  
  return {
    lat: baseLatitude + (vehicleId * 0.01),
    lng: baseLongitude + (vehicleId * 0.015)
  };
};
```

---

## 🔄 When You Add Real GPS Tracking

### Backend Changes Needed:

Add GPS coordinates to the vehicle response:

```json
{
  "vehicle_no": "UP91T4309",
  "imei": "357803372737250",
  "id": 1,
  "gp_id": 1,
  "latitude": 26.2389,      // ← ADD THIS
  "longitude": 73.0243,     // ← ADD THIS
  "status": "running",      // ← ADD THIS (active/inactive/running/stopped)
  "speed": 35,              // ← ADD THIS (km/h)
  "last_updated": "2025-11-02T10:30:00Z"  // ← ADD THIS
}
```

### Frontend Changes Needed:

Update `src/hooks/useVehicles.js`:

```javascript
// REMOVE the mock generation functions
// REMOVE generateMockCoordinates()
// REMOVE generateMockStatus()

// UPDATE the mapping to use real data
return vehicles.map(vehicle => ({
  ...vehicle,
  vehicle_id: vehicle.id,
  vehicle_name: `Vehicle ${vehicle.vehicle_no}`,
  // Use real coordinates from backend
  coordinates: {
    lat: vehicle.latitude,
    lng: vehicle.longitude
  },
  status: vehicle.status,  // Use real status
  speed: vehicle.speed,    // Use real speed
  last_updated: vehicle.last_updated,
  isFlagged: vehicle.is_flagged || false,
}));
```

---

## 🎯 Testing the Integration

### Test Get Vehicles:

```bash
curl -X 'GET' \
  'http://139.59.34.99:8000/api/v1/gps/vehicles?district_id=1&block_id=1&gp_id=1' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### Test Add Vehicle:

```bash
curl -X 'POST' \
  'http://139.59.34.99:8000/api/v1/gps/vehicles' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{
  "gp_id": 1,
  "vehicle_no": "TEST123",
  "imei": "123456789012345"
}'
```

---

## 📁 Files Modified

1. **`src/services/api.js`** - Updated to use `/api/v1/gps/vehicles` endpoint
2. **`src/hooks/useVehicles.js`** - Added mock GPS data generation
3. **`src/hooks/useAddVehicle.js`** - Updated to send correct payload (gp_id, vehicle_no, imei)
4. **`src/components/dashboards/gps/AddVehicleModal.jsx`** - Updated fields to match backend
5. **`src/components/dashboards/GpsTrackingContent.jsx`** - Uses location IDs

---

## ✨ Current Features

✅ Fetches vehicles from real backend API  
✅ Displays vehicles on Google Maps (with mock coordinates)  
✅ Color-coded status markers  
✅ Fleet filtering (All, Active, Running, Stopped)  
✅ Search vehicles  
✅ Add new vehicles  
✅ Vehicle details panel  
✅ Works across all roles (Main, CEO, BDO, VDO)  

---

## 🔜 Next Steps for Real GPS

1. Backend: Add GPS polling from IMEI devices
2. Backend: Store GPS coordinates in database
3. Backend: Add lat/lng/status/speed to API response
4. Frontend: Remove mock data generation
5. Frontend: Add WebSocket for real-time updates
6. Frontend: Add route history tracking

---

**Current Status:** ✅ Fully integrated with backend API (using mock GPS coordinates)  
**Production Ready:** ⏳ Waiting for real GPS data from IMEI devices

