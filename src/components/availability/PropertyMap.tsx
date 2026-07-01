"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, Popup } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { AvailabilityProperty } from "@/lib/services/availability";
import "leaflet/dist/leaflet.css";

// Geocoding cache to avoid repeated API calls
const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

// Geocode an address using OpenStreetMap Nominatim (free)
async function geocodeAddress(
  address: string | null,
  city: string | null,
  state: string | null,
  zip: string | null
): Promise<{ lat: number; lng: number } | null> {
  const parts = [address, city, state, zip].filter(Boolean);
  if (parts.length === 0) return null;

  const fullAddress = parts.join(", ") + ", USA";

  if (geocodeCache.has(fullAddress)) {
    return geocodeCache.get(fullAddress) ?? null;
  }

  try {
    const encoded = encodeURIComponent(fullAddress);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1&countrycodes=us`,
      { headers: { "User-Agent": "RentaBed/1.0" } }
    );

    if (!response.ok) {
      geocodeCache.set(fullAddress, null);
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const coords = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
      geocodeCache.set(fullAddress, coords);
      return coords;
    }

    // Fallback to city, state
    if (city && state) {
      const simpleAddress = `${city}, ${state}, USA`;
      if (geocodeCache.has(simpleAddress)) {
        return geocodeCache.get(simpleAddress) ?? null;
      }

      const simpleEncoded = encodeURIComponent(simpleAddress);
      const simpleResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${simpleEncoded}&limit=1&countrycodes=us`,
        { headers: { "User-Agent": "RentaBed/1.0" } }
      );

      if (simpleResponse.ok) {
        const simpleData = await simpleResponse.json();
        if (simpleData && simpleData.length > 0) {
          const coords = {
            lat: parseFloat(simpleData[0].lat),
            lng: parseFloat(simpleData[0].lon),
          };
          geocodeCache.set(simpleAddress, coords);
          geocodeCache.set(fullAddress, coords);
          return coords;
        }
      }
    }

    geocodeCache.set(fullAddress, null);
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    geocodeCache.set(fullAddress, null);
    return null;
  }
}

// Create price marker icon
function createPriceIcon(price: number | null, isSelected: boolean) {
  const priceText = price ? `$${price.toLocaleString()}` : "View";

  return L.divIcon({
    className: "price-marker-icon",
    html: `
      <div style="
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 8px 12px;
        background: ${isSelected ? "#1e293b" : "#ffffff"};
        color: ${isSelected ? "#ffffff" : "#1e293b"};
        border-radius: 20px;
        font-weight: 600;
        font-size: 14px;
        font-family: system-ui, -apple-system, sans-serif;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        border: 1px solid ${isSelected ? "#1e293b" : "rgba(0,0,0,0.08)"};
        transform: ${isSelected ? "scale(1.1)" : "scale(1)"};
        transition: all 0.15s ease;
        cursor: pointer;
      ">
        ${priceText}
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

interface PropertyWithCoords {
  property: AvailabilityProperty;
  coords: { lat: number; lng: number };
}

// Component to fit map bounds
function MapBounds({ propertiesWithCoords }: { propertiesWithCoords: PropertyWithCoords[] }) {
  const map = useMap();

  useEffect(() => {
    if (propertiesWithCoords.length > 0) {
      const bounds = L.latLngBounds(
        propertiesWithCoords.map(({ coords }) => [coords.lat, coords.lng])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [map, propertiesWithCoords]);

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
  onPropertySelect,
}: PropertyMapProps) {
  const [mounted, setMounted] = useState(false);
  const [propertiesWithCoords, setPropertiesWithCoords] = useState<PropertyWithCoords[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Geocode all properties
  useEffect(() => {
    if (!mounted) return;

    async function geocodeProperties() {
      setIsLoading(true);
      const results: PropertyWithCoords[] = [];

      for (let i = 0; i < properties.length; i++) {
        const property = properties[i];

        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const coords = await geocodeAddress(
          property.address,
          property.city,
          property.state,
          property.zip
        );

        if (coords) {
          results.push({ property, coords });
        }
      }

      setPropertiesWithCoords(results);
      setIsLoading(false);
    }

    geocodeProperties();
  }, [mounted, properties]);

  // Default center (US center)
  const defaultCenter: [number, number] = [39.8283, -98.5795];

  if (!mounted) {
    return (
      <div className="h-full w-full bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
          <span className="text-sm text-slate-500">Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={defaultCenter}
        zoom={4}
        className="h-full w-full"
        zoomControl={false}
      >
        {/* CartoDB Voyager - Modern bright tiles (FREE) */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Zoom control */}
        <div className="leaflet-top leaflet-right">
          <div className="leaflet-control leaflet-bar" style={{ marginTop: 60, marginRight: 10 }}>
            <ZoomControls />
          </div>
        </div>

        <MapBounds propertiesWithCoords={propertiesWithCoords} />

        {propertiesWithCoords.map(({ property, coords }) => (
          <Marker
            key={property.id}
            position={[coords.lat, coords.lng]}
            icon={createPriceIcon(property.minRent, selectedPropertyId === property.id)}
            eventHandlers={{
              click: () => onPropertySelect?.(property.id),
            }}
          >
            <Popup className="property-popup" maxWidth={320} minWidth={280}>
              <PropertyPopupCard property={property} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Loading overlay */}
      {isLoading && properties.length > 0 && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="flex items-center gap-3 bg-white rounded-full px-5 py-3 shadow-lg">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
            <span className="text-sm font-medium text-slate-700">Loading locations...</span>
          </div>
        </div>
      )}

      {/* Property count */}
      {!isLoading && propertiesWithCoords.length > 0 && (
        <div className="absolute top-4 left-4 bg-white rounded-full shadow-md px-4 py-2 text-sm font-medium text-slate-700 z-[1000]">
          {propertiesWithCoords.length} {propertiesWithCoords.length === 1 ? "home" : "homes"}
        </div>
      )}
    </div>
  );
}

// Custom zoom controls
function ZoomControls() {
  const map = useMap();

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
      <button
        onClick={() => map.zoomIn()}
        className="p-2 hover:bg-slate-100 border-b border-slate-200 transition-colors"
        aria-label="Zoom in"
      >
        <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" />
        </svg>
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="p-2 hover:bg-slate-100 transition-colors"
        aria-label="Zoom out"
      >
        <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h12" />
        </svg>
      </button>
    </div>
  );
}

// Property popup card component
function PropertyPopupCard({ property }: { property: AvailabilityProperty }) {
  return (
    <Link href={`/availability/${property.id}`} className="block">
      {/* Property Image */}
      {property.coverPhoto?.public_url ? (
        <div className="relative h-40 w-full overflow-hidden rounded-lg -mx-5 -mt-4 mb-3" style={{ width: 'calc(100% + 40px)' }}>
          <img
            src={property.coverPhoto.public_url}
            alt={property.name}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="h-32 w-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg -mx-5 -mt-4 mb-3 flex items-center justify-center" style={{ width: 'calc(100% + 40px)' }}>
          <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      {/* Content */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900 text-base leading-tight">
          {property.name}
        </h3>
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 whitespace-nowrap shrink-0">
          {property.vacantBeds} bed{property.vacantBeds !== 1 ? "s" : ""}
        </span>
      </div>

      <p className="text-sm text-slate-500 mt-1">
        {[property.city, property.state].filter(Boolean).join(", ")}
      </p>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-lg font-bold text-slate-900">
            {property.minRent ? formatCurrency(property.minRent) : "Contact"}
          </span>
          {property.minRent && (
            <span className="text-slate-500 text-sm"> /month</span>
          )}
        </div>
        <span className="text-indigo-600 text-sm font-medium flex items-center gap-1">
          View
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
