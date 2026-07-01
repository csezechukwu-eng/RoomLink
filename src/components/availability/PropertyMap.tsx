"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { AvailabilityProperty } from "@/lib/services/availability";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Next.js
const defaultIcon = L.divIcon({
  className: "custom-marker",
  html: `<div class="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-full border-2 border-white shadow-lg">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const selectedIcon = L.divIcon({
  className: "custom-marker-selected",
  html: `<div class="flex items-center justify-center w-10 h-10 bg-slate-900 rounded-full border-2 border-white shadow-xl transform scale-110">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// Major US city coordinates for approximate mapping
const CITY_COORDINATES: Record<string, [number, number]> = {
  // Texas
  "houston,tx": [29.7604, -95.3698],
  "dallas,tx": [32.7767, -96.7970],
  "austin,tx": [30.2672, -97.7431],
  "san antonio,tx": [29.4241, -98.4936],
  "fort worth,tx": [32.7555, -97.3308],
  // California
  "los angeles,ca": [34.0522, -118.2437],
  "san francisco,ca": [37.7749, -122.4194],
  "san diego,ca": [32.7157, -117.1611],
  "san jose,ca": [37.3382, -121.8863],
  // Florida
  "miami,fl": [25.7617, -80.1918],
  "orlando,fl": [28.5383, -81.3792],
  "tampa,fl": [27.9506, -82.4572],
  "jacksonville,fl": [30.3322, -81.6557],
  // New York
  "new york,ny": [40.7128, -74.0060],
  "buffalo,ny": [42.8864, -78.8784],
  // Georgia
  "atlanta,ga": [33.7490, -84.3880],
  // Illinois
  "chicago,il": [41.8781, -87.6298],
  // Arizona
  "phoenix,az": [33.4484, -112.0740],
  // Pennsylvania
  "philadelphia,pa": [39.9526, -75.1652],
  "pittsburgh,pa": [40.4406, -79.9959],
  // Ohio
  "columbus,oh": [39.9612, -82.9988],
  "cleveland,oh": [41.4993, -81.6944],
  // North Carolina
  "charlotte,nc": [35.2271, -80.8431],
  "raleigh,nc": [35.7796, -78.6382],
  // Colorado
  "denver,co": [39.7392, -104.9903],
  // Washington
  "seattle,wa": [47.6062, -122.3321],
  // Massachusetts
  "boston,ma": [42.3601, -71.0589],
  // Nevada
  "las vegas,nv": [36.1699, -115.1398],
  // Tennessee
  "nashville,tn": [36.1627, -86.7816],
  "memphis,tn": [35.1495, -90.0490],
  // Oregon
  "portland,or": [45.5152, -122.6784],
  // Michigan
  "detroit,mi": [42.3314, -83.0458],
  // Maryland
  "baltimore,md": [39.2904, -76.6122],
  // Minnesota
  "minneapolis,mn": [44.9778, -93.2650],
  // Louisiana
  "new orleans,la": [29.9511, -90.0715],
  // Missouri
  "kansas city,mo": [39.0997, -94.5786],
  "st. louis,mo": [38.6270, -90.1994],
  // Indiana
  "indianapolis,in": [39.7684, -86.1581],
  // Virginia
  "virginia beach,va": [36.8529, -75.9780],
};

// State center coordinates as fallback
const STATE_COORDINATES: Record<string, [number, number]> = {
  "AL": [32.806671, -86.791130],
  "AK": [61.370716, -152.404419],
  "AZ": [33.729759, -111.431221],
  "AR": [34.969704, -92.373123],
  "CA": [36.116203, -119.681564],
  "CO": [39.059811, -105.311104],
  "CT": [41.597782, -72.755371],
  "DE": [39.318523, -75.507141],
  "FL": [27.766279, -81.686783],
  "GA": [33.040619, -83.643074],
  "HI": [21.094318, -157.498337],
  "ID": [44.240459, -114.478828],
  "IL": [40.349457, -88.986137],
  "IN": [39.849426, -86.258278],
  "IA": [42.011539, -93.210526],
  "KS": [38.526600, -96.726486],
  "KY": [37.668140, -84.670067],
  "LA": [31.169546, -91.867805],
  "ME": [44.693947, -69.381927],
  "MD": [39.063946, -76.802101],
  "MA": [42.230171, -71.530106],
  "MI": [43.326618, -84.536095],
  "MN": [45.694454, -93.900192],
  "MS": [32.741646, -89.678696],
  "MO": [38.456085, -92.288368],
  "MT": [46.921925, -110.454353],
  "NE": [41.125370, -98.268082],
  "NV": [38.313515, -117.055374],
  "NH": [43.452492, -71.563896],
  "NJ": [40.298904, -74.521011],
  "NM": [34.840515, -106.248482],
  "NY": [42.165726, -74.948051],
  "NC": [35.630066, -79.806419],
  "ND": [47.528912, -99.784012],
  "OH": [40.388783, -82.764915],
  "OK": [35.565342, -96.928917],
  "OR": [44.572021, -122.070938],
  "PA": [40.590752, -77.209755],
  "RI": [41.680893, -71.511780],
  "SC": [33.856892, -80.945007],
  "SD": [44.299782, -99.438828],
  "TN": [35.747845, -86.692345],
  "TX": [31.054487, -97.563461],
  "UT": [40.150032, -111.862434],
  "VT": [44.045876, -72.710686],
  "VA": [37.769337, -78.169968],
  "WA": [47.400902, -121.490494],
  "WV": [38.491226, -80.954453],
  "WI": [44.268543, -89.616508],
  "WY": [42.755966, -107.302490],
  "DC": [38.897438, -77.026817],
};

// Get coordinates for a property
function getPropertyCoordinates(property: AvailabilityProperty): [number, number] | null {
  const city = property.city?.toLowerCase().trim();
  const state = property.state?.toUpperCase().trim();

  if (city && state) {
    // Try city + state lookup
    const key = `${city},${state.toLowerCase()}`;
    if (CITY_COORDINATES[key]) {
      // Add small random offset to prevent markers from stacking
      const offset = () => (Math.random() - 0.5) * 0.02;
      const coords = CITY_COORDINATES[key];
      return [coords[0] + offset(), coords[1] + offset()];
    }
  }

  // Fall back to state center
  if (state && STATE_COORDINATES[state]) {
    const offset = () => (Math.random() - 0.5) * 0.5;
    const coords = STATE_COORDINATES[state];
    return [coords[0] + offset(), coords[1] + offset()];
  }

  return null;
}

// Component to fit map bounds to markers
function MapBounds({ properties }: { properties: AvailabilityProperty[] }) {
  const map = useMap();

  useEffect(() => {
    const coords = properties
      .map(p => getPropertyCoordinates(p))
      .filter((c): c is [number, number] => c !== null);

    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [map, properties]);

  return null;
}

interface PropertyMapProps {
  properties: AvailabilityProperty[];
  selectedPropertyId?: string;
  onPropertySelect?: (propertyId: string | null) => void;
}

export function PropertyMap({
  properties,
  selectedPropertyId,
  onPropertySelect
}: PropertyMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const propertiesWithCoords = useMemo(() => {
    return properties
      .map(p => ({
        property: p,
        coords: getPropertyCoordinates(p),
      }))
      .filter((item): item is { property: AvailabilityProperty; coords: [number, number] } =>
        item.coords !== null
      );
  }, [properties]);

  // Default center (US center)
  const defaultCenter: [number, number] = [39.8283, -98.5795];
  const defaultZoom = 4;

  if (!mounted) {
    return (
      <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center">
        <div className="text-slate-400">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBounds properties={properties} />

        {propertiesWithCoords.map(({ property, coords }) => (
          <Marker
            key={property.id}
            position={coords}
            icon={selectedPropertyId === property.id ? selectedIcon : defaultIcon}
            eventHandlers={{
              click: () => onPropertySelect?.(property.id),
            }}
          >
            <Popup>
              <div className="w-56 p-1">
                <Link href={`/availability/${property.id}`} className="block group">
                  <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {property.name}
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {[property.city, property.state].filter(Boolean).join(", ")}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      {property.minRent
                        ? property.minRent === property.maxRent
                          ? formatCurrency(property.minRent)
                          : `${formatCurrency(property.minRent)}+`
                        : "Pricing varies"
                      }
                      <span className="font-normal text-slate-500">/mo</span>
                    </span>
                    <span className="text-sm text-emerald-600 font-medium">
                      {property.vacantBeds} bed{property.vacantBeds !== 1 ? "s" : ""} open
                    </span>
                  </div>
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md px-3 py-2 text-xs text-slate-600 z-[1000]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
          <span>{propertiesWithCoords.length} properties on map</span>
        </div>
      </div>
    </div>
  );
}
