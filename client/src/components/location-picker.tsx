import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet default marker icons
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface LocationPickerProps {
  latitude?: string;
  longitude?: string;
  onLocationChange: (lat: string, lng: string) => void;
}

function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: string, lng: string) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationChange(e.latlng.lat.toString(), e.latlng.lng.toString());
    },
  });
  return null;
}

export function LocationPicker({ latitude, longitude, onLocationChange }: LocationPickerProps) {
  const [showMap, setShowMap] = useState(false);
  const [lat, setLat] = useState(latitude || "40.7128");
  const [lng, setLng] = useState(longitude || "-74.0060");

  const handleSaveLocation = () => {
    onLocationChange(lat, lng);
    setShowMap(false);
  };

  const center: [number, number] = [parseFloat(lat), parseFloat(lng)];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground">Latitude</label>
          <Input
            type="number"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            step="0.0001"
            className="bg-black/20 border-white/10 text-white mt-1"
            placeholder="Latitude"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground">Longitude</label>
          <Input
            type="number"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            step="0.0001"
            className="bg-black/20 border-white/10 text-white mt-1"
            placeholder="Longitude"
          />
        </div>
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowMap(!showMap)}
        className="w-full border-white/10 hover:border-primary"
      >
        {showMap ? "Hide Map" : "Show Map"}
      </Button>

      {showMap && (
        <Card className="bg-black/20 border-white/10 p-3">
          <div className="space-y-2">
            <div className="h-80 rounded border border-white/10 overflow-hidden">
              <MapContainer
                center={center}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                className="z-10"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {!isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng)) && (
                  <Marker position={center}>
                    <Popup>Location: {lat}, {lng}</Popup>
                  </Marker>
                )}
                <MapClickHandler onLocationChange={(newLat, newLng) => {
                  setLat(newLat);
                  setLng(newLng);
                }} />
              </MapContainer>
            </div>
            <p className="text-xs text-muted-foreground">Click on the map to select location</p>
            <Button
              size="sm"
              onClick={handleSaveLocation}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Confirm Location
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
