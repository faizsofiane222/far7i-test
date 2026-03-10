import React, { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from "@react-google-maps/api";
import { MapPin, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const libraries: ("places")[] = ["places"];
const ALGERIA_CENTER = { lat: 36.7538, lng: 3.0588 };

export interface LocationData {
    lat: number;
    lng: number;
    address: string;
}

interface GoogleMapsLocatorProps {
    value?: LocationData | null;
    onChange: (location: LocationData) => void;
    className?: string;
    placeholder?: string;
    error?: boolean;
}

export default function GoogleMapsLocator({
    value,
    onChange,
    className,
    placeholder = "Rechercher une adresse en Algérie...",
    error = false
}: GoogleMapsLocatorProps) {
    // Replace with your actual Vite environment variable for Google Maps API Key
    const { isLoaded, loadError } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        libraries,
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [markerPos, setMarkerPos] = useState<google.maps.LatLngLiteral | null>(
        value ? { lat: value.lat, lng: value.lng } : null
    );
    const [addressInput, setAddressInput] = useState(value?.address || "");
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    // Sync internal state if `value` prop changes from outside
    useEffect(() => {
        if (value) {
            setMarkerPos({ lat: value.lat, lng: value.lng });
            setAddressInput(value.address);
        }
    }, [value]);

    const onLoadCallback = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
    }, []);

    const onUnmountCallback = useCallback(function callback() {
        setMap(null);
    }, []);

    const reverseGeocode = (lat: number, lng: number) => {
        if (!window.google) return;
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results?.[0]) {
                const formattedAddress = results[0].formatted_address;
                setAddressInput(formattedAddress);
                onChange({ lat, lng, address: formattedAddress });
            } else {
                setAddressInput("Position sélectionnée");
                onChange({ lat, lng, address: "Position sélectionnée" });
            }
        });
    };

    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMarkerPos({ lat, lng });
        reverseGeocode(lat, lng);
    };

    const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMarkerPos({ lat, lng });
        reverseGeocode(lat, lng);
    };

    const onPlaceChanged = () => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                const address = place.formatted_address || place.name || "";

                setMarkerPos({ lat, lng });
                setAddressInput(address);
                onChange({ lat, lng, address });

                if (map) {
                    map.panTo({ lat, lng });
                    map.setZoom(15);
                }
            }
        }
    };

    if (loadError) {
        return (
            <div className="w-full h-64 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center text-red-500 font-bold text-sm">
                Erreur de chargement de Google Maps. Vérifiez votre clé d'API.
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className={cn("w-full h-64 bg-[#F8F5F0] border border-[#D4D2CF] rounded-xl flex flex-col gap-2 items-center justify-center", className)}>
                <Loader2 className="w-6 h-6 animate-spin text-[#B79A63]" />
                <p className="text-sm font-bold text-[#1E1E1E]/60">Chargement de la carte...</p>
            </div>
        );
    }

    return (
        <div className={cn("space-y-3 font-lato", className)}>
            {/* Search Input with Autocomplete, restricted to Algeria */}
            <div className="relative">
                <Autocomplete
                    onLoad={(autocomplete) => {
                        autocompleteRef.current = autocomplete;
                        autocomplete.setComponentRestrictions({ country: "dz" });
                    }}
                    onPlaceChanged={onPlaceChanged}
                >
                    <div className="relative">
                        <input
                            type="text"
                            value={addressInput}
                            onChange={(e) => setAddressInput(e.target.value)}
                            placeholder={placeholder}
                            className={cn(
                                "w-full h-12 pl-12 pr-4 rounded-xl border bg-white text-[#1E1E1E] focus:outline-none focus:border-[#B79A63] transition-colors",
                                error ? "border-red-500" : "border-[#D4D2CF]"
                            )}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B79A63]" />
                    </div>
                </Autocomplete>
            </div>

            {/* Map Container */}
            <div className={cn(
                "w-full h-64 md:h-80 rounded-xl overflow-hidden border shadow-sm transition-colors",
                error ? "border-red-500" : "border-[#D4D2CF]"
            )}>
                <GoogleMap
                    mapContainerStyle={{ width: "100%", height: "100%" }}
                    center={markerPos || ALGERIA_CENTER}
                    zoom={markerPos ? 15 : 6}
                    onLoad={onLoadCallback}
                    onUnmount={onUnmountCallback}
                    onClick={handleMapClick}
                    options={{
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                        gestureHandling: "greedy", // allows 1-finger panning on mobile
                    }}
                >
                    {markerPos && (
                        <Marker
                            position={markerPos}
                            draggable={true}
                            onDragEnd={handleMarkerDragEnd}
                            animation={window.google.maps.Animation.DROP}
                        />
                    )}
                </GoogleMap>
            </div>

            {/* Selected Location Indicator */}
            {markerPos && (
                <div className="flex items-start gap-3 text-sm text-[#1E1E1E]/80 bg-[#EBE6DA] p-4 rounded-xl border border-[#D4D2CF]/50 animate-in fade-in zoom-in duration-300">
                    <MapPin className="w-5 h-5 text-[#B79A63] shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold block text-[#1E1E1E] mb-1">Repère placé :</span>
                        <span className="block leading-relaxed">{addressInput || "Coordonnées sélectionnées"}</span>
                        <span className="text-xs font-mono opacity-60 block mt-1">{markerPos.lat.toFixed(6)}, {markerPos.lng.toFixed(6)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
