"use client";
import { useEffect, useRef, useState } from "react";

interface BusLocation {
  latitude:   number;
  longitude:  number;
  updated_at: string;
  route_name?: string;
  shared_by?:  string;
}

interface Props {
  locations: BusLocation[];
  height?:   string;
}

export default function BusMap({ locations, height = "260px" }: Props) {
  const mapRef    = useRef<HTMLDivElement>(null);
  const mapObj    = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  const loc = locations.find(l => l.latitude !== 0 && l.longitude !== 0);

  // Load Leaflet from CDN once
  useEffect(() => {
    if ((window as any).L) { setReady(true); return; }
    if (document.getElementById("leaflet-css")) {
      // CSS already added, wait for JS
      const check = setInterval(() => {
        if ((window as any).L) { clearInterval(check); setReady(true); }
      }, 100);
      return;
    }
    const css  = document.createElement("link");
    css.id     = "leaflet-css";
    css.rel    = "stylesheet";
    css.href   = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);

    const js      = document.createElement("script");
    js.id         = "leaflet-js";
    js.src        = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    js.onload     = () => setReady(true);
    document.head.appendChild(js);
  }, []);

  // Init / update map when ready and location changes
  useEffect(() => {
    if (!ready || !loc || !mapRef.current) return;
    const L   = (window as any).L;
    const pos: [number, number] = [loc.latitude, loc.longitude];

    if (!mapObj.current) {
      mapObj.current = L.map(mapRef.current, { zoomControl: true }).setView(pos, 15);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(mapObj.current);
    }

    if (markerRef.current) {
      markerRef.current.setLatLng(pos);
    } else {
      const icon = L.divIcon({
        html: '<div style="font-size:32px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">🚌</div>',
        iconSize:   [40, 40],
        iconAnchor: [20, 20],
        className:  "",
      });
      markerRef.current = L.marker(pos, { icon }).addTo(mapObj.current);
    }

    markerRef.current
      .bindPopup(`<b>School Bus</b><br>Updated: ${new Date(loc.updated_at).toLocaleTimeString("en-IN")}`)
      .openPopup();
    mapObj.current.setView(pos, 15);
  }, [ready, loc]);

  if (!loc) return null;

  return (
    <div>
      <div ref={mapRef} style={{ height, width: "100%" }} />
      <div style={{ padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", background: "#FAFAF8", borderTop: "1px solid #EDE8DF", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "#6B7A99" }}>
            Updated {new Date(loc.updated_at).toLocaleTimeString("en-IN")}
          </span>
          {loc.shared_by && (
            <span style={{ fontSize: "11px", fontWeight: 700, background: "rgba(23,143,120,0.1)", color: "#178F78", borderRadius: "20px", padding: "2px 8px" }}>
              📡 {loc.shared_by}
            </span>
          )}
        </div>
        <a
          href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: "11px", fontWeight: 700, color: "#178F78", textDecoration: "none" }}
        >
          Open in Google Maps ↗
        </a>
      </div>
    </div>
  );
}
