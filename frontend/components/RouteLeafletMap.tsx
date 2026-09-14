"use client";

import { useEffect, useRef } from "react";

interface RouteStep {
  sequence: number;
  type: "farmer" | "mandi";
  name: string;
  latitude: number;
  longitude: number;
  quantity_kg: number | null;
}

interface RouteLeafletMapProps {
  route: RouteStep[];
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
}

export function RouteLeafletMap({ route, geometry }: RouteLeafletMapProps) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamically import Leaflet (SSR safe)
    import("leaflet").then((L) => {
      // Fix default icon paths broken by webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!).setView(
        [route[0]?.latitude ?? 12.9, route[0]?.longitude ?? 79.1],
        11
      );
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Draw OSRM road geometry
      const polylineCoords = geometry.coordinates.map(
        ([lng, lat]) => [lat, lng] as [number, number]
      );
      const polyline = L.polyline(polylineCoords, {
        color: "#2f7f8f",
        weight: 4,
        opacity: 0.85,
      }).addTo(map);

      // Fit map to route
      map.fitBounds(polyline.getBounds(), { padding: [30, 30] });

      // Add numbered markers for each stop
      route.forEach((step) => {
        const isMandi = step.type === "mandi";
        const bg = isMandi ? "#4f7d5a" : "#2f7f8f";
        const icon = L.divIcon({
          html: `<div style="background:${bg};color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${step.sequence}</div>`,
          className: "",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        L.marker([step.latitude, step.longitude], { icon })
          .addTo(map)
          .bindPopup(
            `<strong>${step.name}</strong><br/>
             Stop #${step.sequence} — ${isMandi ? "Mandi (Destination)" : "Farmer Pickup"}
             ${step.quantity_kg ? `<br/>${step.quantity_kg} kg` : ""}`
          );
      });
    });

    // Add Leaflet CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ height: "320px", width: "100%", borderRadius: "8px", zIndex: 0 }}
    />
  );
}
