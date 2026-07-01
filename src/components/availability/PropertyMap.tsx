"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { AvailabilityProperty } from "@/lib/services/availability";
import "leaflet/dist/leaflet.css";

// Modern price tag marker style (like Airbnb)
function createPriceMarker(price: number | null, isSelected: boolean) {
  const priceText = price ? `$${price.toLocaleString()}` : "View";
  const bgColor = isSelected ? "#000000" : "#ffffff";
  const textColor = isSelected ? "#ffffff" : "#000000";
  const shadow = isSelected
    ? "0 4px 12px rgba(0,0,0,0.4)"
    : "0 2px 8px rgba(0,0,0,0.15)";

  return L.divIcon({
    className: "price-marker",
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px 12px;
        background: ${bgColor};
        color: ${textColor};
        border-radius: 24px;
        font-weight: 600;
        font-size: 14px;
        font-family: inherit;
        white-space: nowrap;
        box-shadow: ${shadow};
        border: 1px solid ${isSelected ? '#000' : 'rgba(0,0,0,0.08)'};
        transform: ${isSelected ? 'scale(1.1)' : 'scale(1)'};
        transition: all 0.15s ease;
        cursor: pointer;
      ">
        ${priceText}
      </div>
    `,
    iconSize: [80, 36],
    iconAnchor: [40, 18],
    popupAnchor: [0, -20],
  });
}

// Geocoding cache to avoid repeated API calls
const geocodeCache = new Map<string, [number, number] | null>();

// Geocode an address using OpenStreetMap Nominatim (free)
async function geocodeAddress(
  address: string | null,
  city: string | null,
  state: string | null,
  zip: string | null
): Promise<[number, number] | null> {
  // Build address string
  const parts = [address, city, state, zip].filter(Boolean);
  if (parts.length === 0) return null;

  const fullAddress = parts.join(", ") + ", USA";

  // Check cache
  if (geocodeCache.has(fullAddress)) {
    return geocodeCache.get(fullAddress) ?? null;
  }

  try {
    const encoded = encodeURIComponent(fullAddress);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1&countrycodes=us`,
      {
        headers: {
          "User-Agent": "RentaBed/1.0",
        },
      }
    );

    if (!response.ok) {
      geocodeCache.set(fullAddress, null);
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const coords: [number, number] = [
        parseFloat(data[0].lat),
        parseFloat(data[0].lon),
      ];
      geocodeCache.set(fullAddress, coords);
      return coords;
    }

    // Try with just city, state if full address fails
    if (city && state) {
      const simpleAddress = `${city}, ${state}, USA`;
      if (geocodeCache.has(simpleAddress)) {
        return geocodeCache.get(simpleAddress) ?? null;
      }

      const simpleEncoded = encodeURIComponent(simpleAddress);
      const simpleResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${simpleEncoded}&limit=1&countrycodes=us`,
        {
          headers: {
            "User-Agent": "RentaBed/1.0",
          },
        }
      );

      if (simpleResponse.ok) {
        const simpleData = await simpleResponse.json();
        if (simpleData && simpleData.length > 0) {
          const coords: [number, number] = [
            parseFloat(simpleData[0].lat),
            parseFloat(simpleData[0].lon),
          ];
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

// Component to fit map bounds to markers
function MapBounds({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
  }, [map, coordinates]);

  return null;
}

interface PropertyWithCoords {
  property: AvailabilityProperty;
  coords: [number, number];
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

      // Process in batches to avoid rate limiting
      for (let i = 0; i < properties.length; i++) {
        const property = properties[i];

        // Add small delay between requests to respect Nominatim rate limits
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
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

  const coordinates = useMemo(
    () => propertiesWithCoords.map((p) => p.coords),
    [propertiesWithCoords]
  );

  // Default center (US center)
  const defaultCenter: [number, number] = [39.8283, -98.5795];
  const defaultZoom = 4;

  if (!mounted) {
    return (
      <div className="h-full w-full bg-slate-50 flex items-center justify-center">
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
        style={{ background: "#f8fafc" }}
      >
        {/* Modern bright map tiles - CartoDB Voyager (similar to Airbnb) */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Zoom controls in bottom right */}
        <ZoomControl position="bottomright" />

        {coordinates.length > 0 && <MapBounds coordinates={coordinates} />}

        {propertiesWithCoords.map(({ property, coords }) => (
          <Marker
            key={property.id}
            position={coords}
            icon={createPriceMarker(property.minRent, selectedPropertyId === property.id)}
            eventHandlers={{
              click: () => onPropertySelect?.(property.id),
            }}
          >
            <Popup className="modern-popup">
              <Link
                href={`/availability/${property.id}`}
                className="block w-64 overflow-hidden"
              >
                {/* Property Image */}
                {property.coverPhoto?.public_url ? (
                  <div className="relative h-40 w-full overflow-hidden rounded-t-lg -m-3 mb-0">
                    <img
                      src={property.coverPhoto.public_url}
                      alt={property.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-32 w-full bg-slate-100 rounded-t-lg -m-3 mb-0 flex items-center justify-center">
                    <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Property Info */}
                <div className="pt-3">
                  <h3 className="font-semibold text-slate-900 text-base leading-tight">
                    {property.name}
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {[property.city, property.state].filter(Boolean).join(", ")}
                  </p>

                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900">
                        {property.minRent
                          ? property.minRent === property.maxRent
                            ? formatCurrency(property.minRent)
                            : `${formatCurrency(property.minRent)}–${formatCurrency(property.maxRent!)}`
                          : "Contact for price"}
                      </span>
                      {property.minRent && (
                        <span className="text-slate-500 text-sm"> /month</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      {property.vacantBeds} bed{property.vacantBeds !== 1 ? "s" : ""} available
                    </span>
                  </div>
                </div>
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Loading overlay */}
      {isLoading && properties.length > 0 && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="flex items-center gap-3 bg-white rounded-full px-5 py-3 shadow-lg">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
            <span className="text-sm font-medium text-slate-700">Loading locations...</span>
          </div>
        </div>
      )}

      {/* Property count badge */}
      {!isLoading && propertiesWithCoords.length > 0 && (
        <div className="absolute top-4 left-4 bg-white rounded-full shadow-md px-4 py-2 text-sm font-medium text-slate-700 z-[1000]">
          {propertiesWithCoords.length} {propertiesWithCoords.length === 1 ? "home" : "homes"}
        </div>
      )}
    </div>
  );
}
