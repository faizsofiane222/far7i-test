import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon missing in production draft
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
    position: [number, number] | null;
    onPositionChange: (lat: number, lng: number) => void;
}

function LocationMarker({ position, onPositionChange }: MapPickerProps) {
    useMapEvents({
        click(e) {
            onPositionChange(e.latlng.lat, e.latlng.lng);
        },
    });

    return position ? <Marker position={position} /> : null;
}

export default function MapPicker({ position, onPositionChange }: MapPickerProps) {
    // Default to Algiers if no position
    const defaultCenter: [number, number] = [36.7538, 3.0588];

    return (
        <div className="h-[300px] w-full rounded-xl overflow-hidden border border-slate-200 z-0">
            <MapContainer
                center={position || defaultCenter}
                zoom={10}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={position} onPositionChange={onPositionChange} />
            </MapContainer>
        </div>
    );
}
