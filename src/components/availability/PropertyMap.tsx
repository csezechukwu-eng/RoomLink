"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  OverlayView,
  InfoWindow,
} from "@react-google-maps/api";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { AvailabilityProperty } from "@/lib/services/availability";

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

interface PropertyWithCoords {
  property: AvailabilityProperty;
  coords: { lat: number; lng: number };
}

// Price marker component
function PriceMarker({
  price,
  isSelected,
  onClick,
}: {
  price: number | null;
  isSelected: boolean;
  onClick: () => void;
}) {
  const priceText = price ? `$${price.toLocaleString()}` : "View";

  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-2 rounded-full font-semibold text-sm whitespace-nowrap
        transition-all duration-150 cursor-pointer
        ${isSelected
          ? "bg-slate-900 text-white shadow-lg scale-110 z-10"
          : "bg-white text-slate-900 shadow-md hover:scale-105 hover:shadow-lg"
        }
        border border-slate-200
      `}
      style={{
        transform: `translate(-50%, -50%) ${isSelected ? 'scale(1.1)' : 'scale(1)'}`,
      }}
    >
      {priceText}
    </button>
  );
}

// Map container style
const containerStyle = {
  width: "100%",
  height: "100%",
};

// Default center (US center)
const defaultCenter = {
  lat: 39.8283,
  lng: -98.5795,
};

// Google Maps options for clean look
const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  zoomControlOptions: {
    position: typeof window !== 'undefined' ? window.google?.maps?.ControlPosition?.RIGHT_BOTTOM : 9,
  },
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  fullscreenControlOptions: {
    position: typeof window !== 'undefined' ? window.google?.maps?.ControlPosition?.RIGHT_TOP : 3,
  },
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "transit",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
};

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
  const [propertiesWithCoords, setPropertiesWithCoords] = useState<PropertyWithCoords[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithCoords | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
  });

  // Geocode all properties
  useEffect(() => {
    if (!isLoaded) return;

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
  }, [isLoaded, properties]);

  // Fit bounds when properties change
  useEffect(() => {
    if (map && propertiesWithCoords.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      propertiesWithCoords.forEach(({ coords }) => {
        bounds.extend(coords);
      });
      map.fitBounds(bounds, 60);

      // Don't zoom in too much
      const listener = google.maps.event.addListener(map, "idle", () => {
        const zoom = map.getZoom();
        if (zoom && zoom > 14) {
          map.setZoom(14);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }, [map, propertiesWithCoords]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleMarkerClick = (item: PropertyWithCoords) => {
    setSelectedProperty(item);
    onPropertySelect?.(item.property.id);
  };

  // Show fallback if no API key
  if (!apiKey) {
    return (
      <div className="h-full w-full bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white rounded-xl p-6 shadow-sm max-w-sm">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">Map Coming Soon</h3>
          <p className="text-sm text-slate-500">
            Configure Google Maps API key to enable the interactive map view.
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="h-full w-full bg-slate-100 flex items-center justify-center">
        <div className="text-slate-500">Error loading map</div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full w-full bg-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
          <span className="text-sm text-slate-500">Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={4}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
        onClick={() => {
          setSelectedProperty(null);
          onPropertySelect?.(null);
        }}
      >
        {propertiesWithCoords.map((item) => (
          <OverlayView
            key={item.property.id}
            position={item.coords}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <PriceMarker
              price={item.property.minRent}
              isSelected={selectedPropertyId === item.property.id}
              onClick={() => handleMarkerClick(item)}
            />
          </OverlayView>
        ))}

        {selectedProperty && (
          <InfoWindow
            position={selectedProperty.coords}
            onCloseClick={() => {
              setSelectedProperty(null);
              onPropertySelect?.(null);
            }}
            options={{
              pixelOffset: new google.maps.Size(0, -20),
              maxWidth: 300,
            }}
          >
            <Link
              href={`/availability/${selectedProperty.property.id}`}
              className="block w-64 overflow-hidden"
            >
              {/* Property Image */}
              {selectedProperty.property.coverPhoto?.public_url ? (
                <div className="relative h-36 w-full overflow-hidden rounded-lg -mx-2 -mt-2 mb-2">
                  <img
                    src={selectedProperty.property.coverPhoto.public_url}
                    alt={selectedProperty.property.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-28 w-full bg-slate-100 rounded-lg -mx-2 -mt-2 mb-2 flex items-center justify-center">
                  <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              <h3 className="font-semibold text-slate-900 text-sm leading-tight">
                {selectedProperty.property.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {[selectedProperty.property.city, selectedProperty.property.state]
                  .filter(Boolean)
                  .join(", ")}
              </p>

              <div className="mt-2 flex items-center justify-between">
                <span className="font-semibold text-slate-900 text-sm">
                  {selectedProperty.property.minRent
                    ? formatCurrency(selectedProperty.property.minRent)
                    : "Contact"}
                  <span className="font-normal text-slate-500"> /mo</span>
                </span>
                <span className="text-xs text-emerald-600 font-medium">
                  {selectedProperty.property.vacantBeds} bed
                  {selectedProperty.property.vacantBeds !== 1 ? "s" : ""} open
                </span>
              </div>
            </Link>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Loading overlay */}
      {isLoading && properties.length > 0 && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="flex items-center gap-3 bg-white rounded-full px-5 py-3 shadow-lg">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
            <span className="text-sm font-medium text-slate-700">Loading locations...</span>
          </div>
        </div>
      )}

      {/* Property count */}
      {!isLoading && propertiesWithCoords.length > 0 && (
        <div className="absolute top-4 left-4 bg-white rounded-full shadow-md px-4 py-2 text-sm font-medium text-slate-700 z-10">
          {propertiesWithCoords.length} {propertiesWithCoords.length === 1 ? "home" : "homes"}
        </div>
      )}
    </div>
  );
}
