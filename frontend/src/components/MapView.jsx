import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, ZoomControl } from 'react-leaflet'
import { getAqiColor, getAqiCategory, getMarkerRadius } from '../utils/aqiColors'
import { formatPM25 } from '../utils/formatters'
import AQILegend from './AQILegend'
import 'leaflet/dist/leaflet.css'

const CITY_CENTERS = {
  Delhi: { center: [28.6139, 77.2090], zoom: 11 },
  Mumbai: { center: [19.0760, 72.8777], zoom: 11 },
  Bengaluru: { center: [12.9716, 77.5946], zoom: 11 }
}

/**
 * Helper component to pan and zoom the Leaflet map dynamically
 */
function ChangeMapView({ center, currentCity }) {
  const map = useMap()
  
  useEffect(() => {
    if (center) {
      // Smoothly pan and zoom to the ward location
      map.setView(center, 13, {
        animate: true,
        duration: 1.0,
      })
    } else {
      // Reset back to selected city's default view if nothing is selected
      const config = CITY_CENTERS[currentCity] || CITY_CENTERS.Delhi
      map.setView(config.center, config.zoom, {
        animate: true,
        duration: 1.0,
      })
    }
  }, [center, currentCity, map])
  
  return null
}

export default function MapView({
  forecasts,
  wards,
  onWardClick,
  selectedWardId,
  center,
  filteredWardIds = [],
  currentCity,
  onCityChange,
  searchQuery,
  setSearchQuery,
  selectedZone,
  setSelectedZone,
  selectedPollutant,
  setSelectedPollutant
}) {
  const cityConfig = CITY_CENTERS[currentCity] || CITY_CENTERS.Delhi

  return (
    <div className="relative w-full h-full">
      {/* Floating Control Panel */}
      <div className="absolute top-4 left-4 right-4 lg:right-auto lg:w-[760px] z-[1000] bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xl p-3 flex flex-wrap lg:flex-nowrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="🔍 Search monitoring station..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* Dropdown 1: City Selector */}
        <div className="flex items-center gap-1.5 bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">City:</span>
          <select
            value={currentCity}
            onChange={(e) => {
              onCityChange(e.target.value)
              // Reset other filters when changing city
              setSelectedZone('All')
            }}
            className="bg-transparent text-slate-700 text-xs font-extrabold focus:outline-none cursor-pointer"
          >
            <option value="Delhi">Delhi NCT</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Bengaluru">Bengaluru</option>
          </select>
        </div>

        {/* Dropdown 2: Zone Selector */}
        <div className="flex items-center gap-1.5 bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Zone:</span>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="bg-transparent text-slate-700 text-xs font-extrabold focus:outline-none cursor-pointer"
          >
            <option value="All">All Zones</option>
            <option value="North">North</option>
            <option value="South">South</option>
            <option value="East">East</option>
            <option value="West">West</option>
            <option value="Central">Central</option>
            {currentCity === 'Delhi' && <option value="North-West">North-West</option>}
            {currentCity === 'Delhi' && <option value="South-West">South-West</option>}
          </select>
        </div>

        {/* Dropdown 3: Pollutant Selector */}
        <div className="flex items-center gap-1.5 bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Show:</span>
          <select
            value={selectedPollutant}
            onChange={(e) => setSelectedPollutant(e.target.value)}
            className="bg-transparent text-slate-700 text-xs font-extrabold focus:outline-none cursor-pointer"
          >
            <option value="AQI">AQI Index</option>
            <option value="PM25">PM2.5 Conc.</option>
            <option value="PM10">PM10 Conc.</option>
          </select>
        </div>
      </div>

      <MapContainer
        center={cityConfig.center}
        zoom={cityConfig.zoom}
        className="w-full h-full bg-slate-100"
        zoomControl={false}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* Custom Zoom Control in Bottom Right */}
        <ZoomControl position="bottomright" />

        {/* Change map view observer */}
        <ChangeMapView center={center} currentCity={currentCity} />

        {forecasts.map((forecast, index) => {
          const ward = wards.find(w => w.ward_id === forecast.ward_id)
          if (!ward) return null

          const aqi = forecast.current_aqi
          const color = getAqiColor(aqi)
          const category = getAqiCategory(aqi)
          const radius = getMarkerRadius(aqi)
          const isSelected = selectedWardId === forecast.ward_id
          
          // De-emphasize markers that are filtered out
          const isFilteredOut = filteredWardIds.length > 0 && !filteredWardIds.includes(forecast.ward_id)

          // Determine value to show based on selected pollutant
          let displayVal = `${Math.round(aqi)} AQI`
          if (selectedPollutant === 'PM25') {
            displayVal = `${formatPM25(forecast.current_pm25)}`
          } else if (selectedPollutant === 'PM10') {
            displayVal = `${Math.round(forecast.pollutants?.pm10 || aqi * 1.5)} µg/m³`
          }

          return (
            <CircleMarker
              key={forecast.ward_id}
              center={[ward.lat, ward.lon]}
              radius={isSelected ? radius + 5 : radius}
              pathOptions={{
                color: isSelected ? '#0f172a' : color,
                fillColor: color,
                fillOpacity: isFilteredOut ? 0.08 : (isSelected ? 0.95 : 0.75),
                opacity: isFilteredOut ? 0.08 : 1.0,
                weight: isSelected ? 3.5 : (isFilteredOut ? 0.5 : 2),
              }}
              eventHandlers={{
                click: () => onWardClick(forecast.ward_id),
              }}
            >
              <Popup className="dark-popup" maxWidth={400}>
                <div className="flex items-center gap-4 text-xs font-bold whitespace-nowrap leading-none divide-x divide-slate-800 [&>div]:pl-4 first:[&>div]:pl-0">
                  <div>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase block mb-1">Station</span>
                    <span className="text-white text-xs font-black">{ward.name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase block mb-1">AQI</span>
                    <span className="text-xs font-black" style={{ color: color }}>{Math.round(aqi)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase block mb-1">PM2.5</span>
                    <span className="text-white text-xs font-black">{formatPM25(forecast.current_pm25)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase block mb-1">Priority</span>
                    <span className="text-white text-xs font-black">#{index + 1}</span>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>

      <AQILegend />
    </div>
  )
}
