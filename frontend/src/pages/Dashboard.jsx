import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchAllForecasts, fetchWards, fetchAdvisory, fetchAttribution, fetchWardForecast } from '../api/client'
import MapView from '../components/MapView'
import ShapAttributionChart from '../components/ShapAttributionChart'
import { getAqiColor, getAqiCategory } from '../utils/aqiColors'
import { formatPopulation, formatPM25 } from '../utils/formatters'

// Multi-language translation maps
const TRANSLATIONS = {
  en: {
    title: "Health Advisory",
    risk: "Risk",
    actionsTitle: "Recommended Actions",
    noAdvisory: "No advisory available"
  },
  hi: {
    title: "स्वास्थ्य सलाह",
    risk: "जोखिम",
    actionsTitle: "अनुशंसित कार्रवाइयां",
    noAdvisory: "कोई सलाह उपलब्ध नहीं है",
    risk_levels: {
      low: "कम जोखिम",
      moderate: "मध्यम जोखिम",
      high: "उच्च जोखिम",
      severe: "ಗಂಭೀರ ಅಪಾಯ"
    },
    messages: {
      good: "वायु गुणवत्ता अच्छी (AQI {aqi}) रहने की उम्मीद है। बाहरी गतिविधियों का स्वतंत्र रूप से आनंद लें।",
      satisfactory: "वायु गुणवत्ता संतोषजनक (AQI {aqi}) रहने की उम्मीद है। संवेदनशील समूहों के लिए मामूली चिंता।",
      moderate: "वायु गुणवत्ता मध्यम (AQI {aqi}) रहने की उम्मीद है। संवेदनशील समूहों को सावधानी बरतनी चाहिए।",
      poor: "⚠️ उच्च PM2.5 की उम्मीद है (AQI {aqi})। बाहरी गतिविधियों से बचें, विशेष रूप से सुबह 6-9 बजे और शाम 6-9 बजे।",
      verypoor: "🔴 बहुत खराब वायु गुणवत्ता (AQI {aqi}) की उम्मीद है। सभी निवासियों को बाहरी संपर्क कम करना चाहिए।",
      severe: "🚨 गंभीर वायु गुणवत्ता चेतावनी (AQI {aqi})। घर के अंदर रहें। स्वास्थ्य आपातकाल की स्थिति।"
    },
    actions: {
      "No precautions needed": "किसी सावधानी की आवश्यकता नहीं है",
      "Great day for outdoor exercise": "बाहरी व्यायाम के लिए अच्छा दिन है",
      "Sensitive individuals may consider limiting prolonged outdoor exertion": "संवेदनशील व्यक्तियों को लंबे समय तक बाहरी परिश्रम को सीमित करने पर विचार करना चाहिए",
      "Keep windows open for ventilation": "वेंटिलेशन के लिए खिड़कियां खुली रखें",
      "People with respiratory conditions should limit outdoor exposure": "श्वसन समस्याओं वाले लोगों को बाहरी संपर्क सीमित करना चाहिए",
      "Consider wearing N95 mask during peak traffic hours": "पीक ट्रैफिक घंटों के दौरान N95 मास्क पहनने पर विचार करें",
      "Keep indoor air purifiers running": "इनडोर एयर प्यूरीफायर चालू रखें",
      "Sensitive groups should avoid outdoor activity": "संवेदनशील समूहों को बाहरी गतिविधियों से बचना चाहिए",
      "Use N95 masks when outdoors": "बाहर होने पर N95 मास्क का उपयोग करें",
      "Keep windows closed, use air purifier": "खिड़कियां बंद रखें, एयर प्यूरीफायर का उपयोग करें",
      "Avoid outdoor exercise — use indoor alternatives": "बाहरी व्यायाम से बचें — इनडोर विकल्पों का उपयोग करें",
      "Everyone should avoid prolonged outdoor activity": "सभी को लंबे समय तक बाहरी गतिविधियों से बचना चाहिए",
      "N95 masks essential when outdoors": "बाहर होने पर N95 मास्क आवश्यक है",
      "Keep all windows and doors closed": "सभी खिड़कियां और दरवाजे बंद रखें",
      "Schools should consider indoor-only activities": "स्कूलों को केवल इनडोर गतिविधियों पर विचार करना चाहिए",
      "Monitor for respiratory symptoms — seek medical help if needed": "श्वसन लक्षणों की निगरानी करें — यदि आवश्यक हो तो चिकित्सा सहायता लें",
      "Stay indoors as much as possible": "जितना हो सके घर के अंदर रहें",
      "N95/N99 masks essential for any outdoor exposure": "किसी भी बाहरी संपर्क के लिए N95/N99 मास्क आवश्यक है",
      "Seal windows, run air purifiers on max": "खिड़कियां सील करें, एयर प्यूरीफायर को अधिकतम पर चलाएं",
      "Avoid all outdoor exercise and labor": "सभी बाहरी व्यायाम और श्रम से बचें",
      "Schools and outdoor workers: consider closure/work-from-home": "स्कूल और बाहरी कर्मचारी: बंद करने/घर से काम करने पर विचार करें",
      "Seek immediate medical attention for breathing difficulty": "सांस लेने में कठिनाई होने पर तुरंत चिकित्सा सहायता लें"
    }
  },
  kn: {
    title: "ಆರೋಗ್ಯ ಸಲಹೆ",
    risk: "ಅಪಾಯ",
    actionsTitle: "ಶಿಫಾರಸು ಮಾಡಿದ ಕ್ರಮಗಳು",
    noAdvisory: "ಯಾವುದೇ ಸಲಹೆ ಲಭ್ಯವಿಲ್ಲ",
    risk_levels: {
      low: "ಕಡಿಮೆ ಅಪಾಯ",
      moderate: "ಮಧ್ಯಮ ಅಪಾಯ",
      high: "ಹೆಚ್ಚು ಅಪಾಯ",
      severe: "ಗಂಭೀರ ಅಪಾಯ"
    },
    messages: {
      good: "ವಾಯು ಗುಣಮಟ್ಟವು ಉತ್ತಮವಾಗಿರುತ್ತದೆ (AQI {aqi}) ನಿರೀಕ್ಷಿಸಲಾಗಿದೆ. ಹೊರಾಂಗಣ ಚಟುವಟಿಕೆಗಳನ್ನು ಮುಕ್ತವಾಗಿ ಆನಂದಿಸಿ.",
      satisfactory: "ವಾಯು ಗುಣಮಟ್ಟವು ತೃಪ್ತಿಕರವಾಗಿರುತ್ತದೆ (AQI {aqi}) ನಿರೀಕ್ಷಿಸಲಾಗಿದೆ. ಸೂಕ್ಷ್ಮ ಗುಂಪುಗಳಿಗೆ ಸಣ್ಣ ಕಾಳಜಿ.",
      moderate: "ವಾಯು ಗುಣಮಟ್ಟವು ಮಧ್ಯಮವಾಗಿರುತ್ತದೆ (AQI {aqi}) ನಿರೀಕ್ಷಿಸಲಾಗಿದೆ. ಸೂಕ್ಷ್ಮ ಗುಂಪುಗಳು ಮುನ್ನೆಚ್ಚರಿಕೆಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಬೇಕು.",
      poor: "⚠️ ಹೆಚ್ಚಿನ PM2.5 ನಿರೀಕ್ಷಿಸಲಾಗಿದೆ (AQI {aqi}). ವಿಶೇಷವಾಗಿ ಬೆಳಿಗ್ಗೆ 6-9 ಮತ್ತು ಸಂಜೆ 6-9 ರ ನಡುವೆ ಹೊರಾಂಗಣ ಚಟುವಟಿಕೆಗಳನ್ನು ತಪ್ಪಿಸಿ.",
      verypoor: "🔴 ಅತ್ಯಂತ ಕಳಪೆ ವಾಯು ಗುಣಮಟ್ಟ (AQI {aqi}) ನಿರೀಕ್ಷಿಸಲಾಗಿದೆ. ಎಲ್ಲಾ ನಿವಾಸಿಗಳು ಹೊರಾಂಗಣ ಚಟುವಟಿಕೆಯನ್ನು ಕಡಿಮೆ ಮಾಡಬೇಕು.",
      severe: "🚨 ಗಂಭೀರ ವಾಯು ಗುಣಮಟ್ಟದ ಎಚ್ಚರಿಕೆ (AQI {aqi}). ಮನೆಯಲ್ಲೇ ಇರಿ. ಆರೋಗ್ಯ ತುರ್ತು ಪರಿಸ್ಥಿತಿ."
    },
    actions: {
      "No precautions needed": "ಯಾವುದೇ ಮುನ್ನೆಚ್ಚರಿಕೆಗಳು ಅಗತ್ಯವಿಲ್ಲ",
      "Great day for outdoor exercise": "ಹೊರಾಂಗಣ ವ್ಯಾಯಾಮಕ್ಕೆ ಉತ್ತಮ ದಿನ",
      "Sensitive individuals may consider limiting prolonged outdoor exertion": "ಸೂಕ್ಷ್ಮ ವ್ಯಕ್ತಿಗಳು ಹೊರಾಂಗಣ ಚಟುವಟಿಕೆಯನ್ನು ಮಿತಿಗೊಳಿಸುವುದನ್ನು ಪರಿಗಣಿಸಬಹುದು",
      "Keep windows open for ventilation": "ವಾತಾಯನಕ್ಕಾಗಿ ಕಿಟಕಿಗಳನ್ನು ತೆರೆದಿಡಿ",
      "People with respiratory conditions should limit outdoor exposure": "ಉಸಿರಾಟದ ತೊಂದರೆ ಇರುವವರು ಹೊರಾಂಗಣ ಚಟುವಟಿಕೆಯನ್ನು ಮಿತಿಗೊಳಿಸಬೇಕು",
      "Consider wearing N95 mask during peak traffic hours": "ಸಂಚಾರ ದಟ್ಟಣೆಯ ಸಮಯದಲ್ಲಿ N95 ಮಾಸ್ಕ್ ಧರಿಸುವುದನ್ನು ಪರಿಗಣಿಸಿ",
      "Keep indoor air purifiers running": "ಮನೆಯೊಳಗಿನ ಏರ್ ಪ್ಯೂರಿಫೈಯರ್‌ಗಳನ್ನು ಚಾಲನೆಯಲ್ಲಿಡಿ",
      "Sensitive groups should avoid outdoor activity": "ಸೂಕ್ಷ್ಮ ಗುಂಪುಗಳು ಹೊರಾಂಗಣ ಚಟುವಟಿಕೆಯನ್ನು ತಪ್ಪಿಸಬೇಕು",
      "Use N95 masks when outdoors": "ಹೊರಗೆ ಹೋಗುವಾಗ N95 ಮಾಸ್ಕ್ ಬಳಸಿ",
      "Keep windows closed, use air purifier": "ಕಿಟಕಿಗಳನ್ನು ಮುಚ್ಚಿಡಿ, ಏರ್ ಪ್ಯೂರಿಫೈಯರ್ ಬಳಸಿ",
      "Avoid outdoor exercise — use indoor alternatives": "ಹೊರಾಂಗಣ ವ್ಯಾಯಾಮ ತಪ್ಪಿಸಿ — ಒಳಾಂಗಣ ಪರ್ಯಾಯಗಳನ್ನು ಬಳಸಿ",
      "Everyone should avoid prolonged outdoor activity": "ಎಲ್ಲರೂ ಹೊರಾಂಗಣ ಚಟುವಟಿಕೆಗಳನ್ನು ತಪ್ಪಿಸಬೇಕು",
      "N95 masks essential when outdoors": "ಹೊರಗೆ ಹೋಗುವಾಗ N95 ಮಾಸ್ಕ್ ಕಡ್ಡಾಯ",
      "Keep all windows and doors closed": "ಎಲ್ಲಾ ಕಿಟಕಿ ಮತ್ತು ಬಾಗಿಲುಗಳನ್ನು ಮುಚ್ಚಿಡಿ",
      "Schools should consider indoor-only activities": "ಶಾಲೆಗಳು ಒಳಾಂಗಣ ಚಟುವಟಿಕೆಗಳನ್ನು ಮಾತ್ರ ನಡೆಸಲು ಪರಿಗಣಿಸಬೇಕು",
      "Monitor for respiratory symptoms — seek medical help if needed": "ಉಸಿರಾಟದ ಲಕ್ಷಣಗಳನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿ — ಅಗತ್ಯವಿದ್ದರೆ ವೈದ್ಯಕೀಯ ಸಹಾಯ ಪಡೆಯಿರಿ",
      "Stay indoors as much as possible": "ಸಾಧ್ಯವಾದಷ್ಟು ಮನೆಯಲ್ಲೇ ಇರಿ",
      "N95/N99 masks essential for any outdoor exposure": "ಹೊರಾಂಗಣ ಚಟುವಟಿಕೆಗಳಿಗೆ N95/N99 ಮಾಸ್ಕ್ ಕಡ್ಡಾಯ",
      "Seal windows, run air purifiers on max": "ಕಿಟಕಿಗಳನ್ನು ಭದ್ರಪಡಿಸಿ, ಏರ್ ಪ್ಯೂರಿಫೈಯರ್ ಗರಿಷ್ಠ ವೇಗದಲ್ಲಿ ಬಳಸಿ",
      "Avoid all outdoor exercise and labor": "ಹೊರಾಂಗಣ ವ್ಯಾಯಾಮ ಮತ್ತು ದೈಹಿಕ ಶ್ರಮವನ್ನು ತಪ್ಪಿಸಿ",
      "Schools and outdoor workers: consider closure/work-from-home": "ಶಾಲೆಗಳು ಮತ್ತು ಹೊರಾಂಗಣ ಕೆಲಸಗಾರರು: ಮುಚ್ಚುವಿಕೆ ಅಥವಾ ಮನೆಯಿಂದ ಕೆಲಸ ಮಾಡುವುದನ್ನು ಪರಿಗಣಿಸಿ",
      "Seek immediate medical attention for breathing difficulty": "ಉಸಿರಾಟದ ತೊಂದರೆ ಉಂಟಾದರೆ ತಕ್ಷಣ ವೈದ್ಯಕೀಯ ಚಿಕಿತ್ಸೆ ಪಡೆಯಿರಿ"
    }
  }
}

// City-wide fallback factors for Card 2
const CITY_EXPLAINERS = {
  Delhi: {
    factors: [
      { factor: "Winter Inversion", shap_value: 38.2, direction: "increasing" },
      { factor: "Vehicle Emissions", shap_value: 24.5, direction: "increasing" },
      { factor: "Crop Stubble Smoke", shap_value: 18.0, direction: "increasing" },
      { factor: "High Wind Speed", shap_value: -12.4, direction: "decreasing" }
    ]
  },
  Mumbai: {
    factors: [
      { factor: "Vehicular Traffic", shap_value: 15.4, direction: "increasing" },
      { factor: "Construction Dust", shap_value: 12.8, direction: "increasing" },
      { factor: "Sea Breeze Dispersion", shap_value: -26.5, direction: "decreasing" },
      { factor: "Industrial Exhaust", shap_value: 8.2, direction: "increasing" }
    ]
  },
  Bengaluru: {
    factors: [
      { factor: "Road Dust & Traffic", shap_value: 22.4, direction: "increasing" },
      { factor: "Construction Sites", shap_value: 16.5, direction: "increasing" },
      { factor: "High Altitude Winds", shap_value: -14.2, direction: "decreasing" },
      { factor: "Manufacturing Peaks", shap_value: 7.8, direction: "increasing" }
    ]
  }
}

/**
 * Premium Semicircle Gauge Component
 */
function SemiCircleGauge({ value, max = 500, label, color }) {
  const percentage = Math.min(value / max, 1)
  const strokeDasharray = 125.6
  const strokeDashoffset = strokeDasharray - (percentage * strokeDasharray)
  
  return (
    <div className="relative flex flex-col items-center justify-end w-36 h-20 overflow-hidden">
      <svg className="w-28 h-14" viewBox="0 0 100 50">
        <path
          d="M 10,50 A 40,40 0 0,1 90,50"
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M 10,50 A 40,40 0 0,1 90,50"
          fill="none"
          stroke={color || "#e2e8f0"}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute bottom-0 flex flex-col items-center">
        <span className="text-xl font-black text-slate-800 leading-none">{value}</span>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</span>
      </div>
    </div>
  )
}

export default function Dashboard({ currentCity, onCityChange }) {
  const [forecasts, setForecasts] = useState([])
  const [wards, setWards] = useState([])
  const [selectedWardId, setSelectedWardId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()

  // Filter States (raised and managed in floating top bar)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedZone, setSelectedZone] = useState('All')
  const [selectedPollutant, setSelectedPollutant] = useState('AQI')

  // Detailed Card States
  const [activeAdvisory, setActiveAdvisory] = useState(null)
  const [activeAttribution, setActiveAttribution] = useState(null)
  const [activeForecast, setActiveForecast] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [advisoryLang, setAdvisoryLang] = useState('en')

  // Favorites System
  const [favoriteWards, setFavoriteWards] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('favorite_wards') || '[]')
    } catch {
      return []
    }
  })

  // Load Main Wards & Forecasts
  useEffect(() => {
    setLoading(true)
    Promise.all([fetchAllForecasts(currentCity), fetchWards(currentCity)])
      .then(([forecastRes, wardRes]) => {
        const newWards = wardRes.wards || []
        setForecasts(forecastRes.forecasts || [])
        setWards(newWards)

        // Clear selection if it does not belong to the selected city's wards
        if (selectedWardId && !newWards.some(w => w.ward_id === selectedWardId)) {
          setSelectedWardId(null)
        }

        // Check URL params for pre-selected ward
        const wardParam = searchParams.get('ward')
        if (wardParam && newWards.some(w => w.ward_id === wardParam)) {
          setSelectedWardId(wardParam)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [currentCity, searchParams])

  // Load Detailed Data on selection
  useEffect(() => {
    if (selectedWardId) {
      setDetailsLoading(true)
      Promise.all([
        fetchAdvisory(selectedWardId),
        fetchAttribution(selectedWardId),
        fetchWardForecast(selectedWardId)
      ])
        .then(([advRes, attRes, foreRes]) => {
          setActiveAdvisory(advRes)
          setActiveAttribution(attRes)
          setActiveForecast(foreRes)
        })
        .catch(console.error)
        .finally(() => setDetailsLoading(false))
    } else {
      setActiveAdvisory(null)
      setActiveAttribution(null)
      setActiveForecast(null)
    }
  }, [selectedWardId])

  const selectedWard = wards.find(w => w.ward_id === selectedWardId)
  const selectedCenter = selectedWard ? [selectedWard.lat, selectedWard.lon] : null

  // Calculate City average stats
  const avgAqi = forecasts.length
    ? Math.round(forecasts.reduce((sum, f) => sum + f.current_aqi, 0) / forecasts.length)
    : 0

  // Filter based on search and zone selection
  const filteredForecasts = forecasts.filter(f => {
    const ward = wards.find(w => w.ward_id === f.ward_id)
    if (!ward) return false
    const matchesSearch = ward.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesZone = selectedZone === 'All' || ward.zone === selectedZone
    return matchesSearch && matchesZone
  })

  // Favorites actions
  const isFavorite = selectedWardId ? favoriteWards.includes(selectedWardId) : false
  const toggleFavorite = () => {
    if (!selectedWardId) return
    let updated
    if (isFavorite) {
      updated = favoriteWards.filter(id => id !== selectedWardId)
    } else {
      updated = [...favoriteWards, selectedWardId]
    }
    setFavoriteWards(updated)
    localStorage.setItem('favorite_wards', JSON.stringify(updated))
  }

  // City-wide dynamic advisory generator
  const getCityAdvisory = () => {
    let cat = "moderate"
    if (avgAqi <= 50) cat = "good"
    else if (avgAqi <= 100) cat = "satisfactory"
    else if (avgAqi <= 200) cat = "moderate"
    else if (avgAqi <= 300) cat = "poor"
    else if (avgAqi <= 400) cat = "verypoor"
    else cat = "severe"

    const advisoryTemplates = {
      good: {
        risk_level: "low",
        message: `Average air quality in ${currentCity} is Good (AQI ${avgAqi}). Enjoy outdoor activities freely.`,
        actions: ["No precautions needed", "Great day for outdoor exercise"]
      },
      satisfactory: {
        risk_level: "low",
        message: `Average air quality in ${currentCity} is Satisfactory (AQI ${avgAqi}). Minor concern for sensitive groups.`,
        actions: ["Sensitive groups consider limiting exertion", "Keep windows open for ventilation"]
      },
      moderate: {
        risk_level: "moderate",
        message: `Average air quality in ${currentCity} is Moderate (AQI ${avgAqi}). Take standard precautions.`,
        actions: ["Respiratory groups limit exposure", "Run indoor air purifiers if needed"]
      },
      poor: {
        risk_level: "high",
        message: `Average air quality in ${currentCity} is Poor (AQI ${avgAqi}). Reduce prolonged outdoor exposure.`,
        actions: ["Sensitive groups avoid outdoors", "Wear N95 masks during traffic hours"]
      },
      verypoor: {
        risk_level: "severe",
        message: `Average air quality in ${currentCity} is Very Poor (AQI ${avgAqi}). Minimize outdoor contact.`,
        actions: ["Everyone minimize outdoor exertion", "N95 masks essential when outdoors"]
      },
      severe: {
        risk_level: "severe",
        message: `🚨 SEVERE Air Quality Alert for ${currentCity} (AQI ${avgAqi}). Health emergency conditions.`,
        actions: ["Stay indoors as much as possible", "N95/N99 masks essential for exposure"]
      }
    }
    
    return {
      ward_id: "city_wide",
      ward_name: `${currentCity} NCT`,
      city: currentCity,
      aqi: avgAqi,
      category: cat,
      risk_level: advisoryTemplates[cat].risk_level,
      message: advisoryTemplates[cat].message,
      actions: advisoryTemplates[cat].actions
    }
  }

  // Translations processing for Card 3
  const advisoryToShow = selectedWardId ? activeAdvisory : getCityAdvisory()
  let translatedTitle = TRANSLATIONS[advisoryLang].title
  let translatedMessage = advisoryToShow?.message || ''
  let translatedActions = advisoryToShow?.actions || []

  if (advisoryLang !== 'en' && advisoryToShow) {
    const dict = TRANSLATIONS[advisoryLang]
    translatedTitle = dict.title
    
    // Translate message template
    if (dict.messages && dict.messages[advisoryToShow.category]) {
      translatedMessage = dict.messages[advisoryToShow.category]
        .replace('{ward}', advisoryToShow.ward_name)
        .replace('{aqi}', Math.round(advisoryToShow.aqi))
    }
    
    // Translate actions
    if (dict.actions) {
      translatedActions = (advisoryToShow.actions || []).map(action => dict.actions[action] || action)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-100 h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm font-medium animate-pulse-soft">Loading {currentCity} air quality data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
      {/* Map Section - Top 60% */}
      <div className="flex-[6] relative min-h-[300px]">
        <MapView
          forecasts={forecasts}
          wards={wards}
          onWardClick={setSelectedWardId}
          selectedWardId={selectedWardId}
          center={selectedCenter}
          filteredWardIds={filteredForecasts.map(f => f.ward_id)}
          currentCity={currentCity}
          onCityChange={onCityChange}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedZone={selectedZone}
          setSelectedZone={setSelectedZone}
          selectedPollutant={selectedPollutant}
          setSelectedPollutant={setSelectedPollutant}
        />
      </div>

      {/* Details Dashboard Row - Bottom 40% */}
      <div className="flex-[4] bg-slate-50 border-t border-slate-200/80 p-6 overflow-hidden min-h-[240px]">
        <div className="max-w-[1920px] mx-auto h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Overview & Location Stats */}
          <div className="h-full">
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-full relative">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Location</span>
                    <h3 className="text-xl font-black text-slate-800 leading-tight mt-1 truncate">
                      {selectedWard ? selectedWard.name : `${currentCity} NCT`}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                      {selectedWard ? `${selectedWard.zone} Zone` : `Aggregated stats (${filteredForecasts.length} active stations)`}
                    </p>
                  </div>
                  
                  {/* Heart button */}
                  {selectedWard && (
                    <button
                      onClick={toggleFavorite}
                      className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                        isFavorite
                          ? 'bg-red-50 border-red-200 text-red-500'
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {isFavorite ? '❤️' : '🤍'}
                    </button>
                  )}
                </div>

                {/* 3 Horizon Forecast Badges */}
                <div className="mt-4 flex gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
                    <span className="text-[8px] text-slate-400 font-extrabold uppercase block leading-none">24h forecast</span>
                    <span className="text-xs font-black text-slate-700 block mt-1">
                      {selectedWard && activeForecast ? `${Math.round(activeForecast.forecast_aqi_24h)} AQI` : `${Math.round(avgAqi)} AQI`}
                    </span>
                  </div>
                  <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
                    <span className="text-[8px] text-slate-400 font-extrabold uppercase block leading-none">48h forecast</span>
                    <span className="text-xs font-black text-slate-700 block mt-1">
                      {selectedWard && activeForecast ? `${Math.round(activeForecast.forecast_aqi_48h)} AQI` : `${Math.round(avgAqi * 1.05)} AQI`}
                    </span>
                  </div>
                  <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
                    <span className="text-[8px] text-slate-400 font-extrabold uppercase block leading-none">72h forecast</span>
                    <span className="text-xs font-black text-slate-700 block mt-1">
                      {selectedWard && activeForecast ? `${Math.round(activeForecast.forecast_aqi_72h)} AQI` : `${Math.round(avgAqi * 1.1)} AQI`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-cards Row (matching reference image) */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="bg-slate-50/50 border border-slate-200/50 rounded-xl p-2.5 flex flex-col justify-between">
                  <div className="w-6 h-6 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center text-xs">
                    📅
                  </div>
                  <div className="mt-2">
                    <span className="text-[8px] text-slate-400 font-extrabold uppercase block leading-none">Record Date</span>
                    <span className="text-[10px] font-black text-slate-700 block mt-1">31.01.2026</span>
                  </div>
                </div>
                <div className="bg-slate-50/50 border border-slate-200/50 rounded-xl p-2.5 flex flex-col justify-between">
                  <div className="w-6 h-6 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center text-xs">
                    👥
                  </div>
                  <div className="mt-2">
                    <span className="text-[8px] text-slate-400 font-extrabold uppercase block leading-none">Population</span>
                    <span className="text-[10px] font-black text-slate-700 block mt-1 truncate">
                      {selectedWard ? formatPopulation(selectedWard.population_approx) : formatPopulation(wards.reduce((sum, w) => sum + w.population_approx, 0))}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50/50 border border-slate-200/50 rounded-xl p-2.5 flex flex-col justify-between">
                  <div className="w-6 h-6 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center text-xs">
                    🌡️
                  </div>
                  <div className="mt-2">
                    <span className="text-[8px] text-slate-400 font-extrabold uppercase block leading-none">Temp/Wind</span>
                    <span className="text-[10px] font-black text-slate-700 block mt-1 truncate">
                      {selectedWard && activeForecast?.weather ? `${Math.round(activeForecast.weather.temperature)}°C` : '32°C'} / {selectedWard && activeForecast?.weather ? `${Math.round(activeForecast.weather.wind_speed)}k` : '12k'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: AI Explainability (SHAP attributions) */}
          <div className="h-full">
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-full overflow-hidden">
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">AI Explainability</span>
                  <h3 className="text-base font-black text-slate-800 leading-tight mt-1 mb-3">
                    {selectedWard ? `SHAP Factors: ${selectedWard.name}` : `City Baseline Factors`}
                  </h3>
                </div>
                
                {detailsLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center">
                    <div className="w-full">
                      <ShapAttributionChart attributionData={selectedWard ? activeAttribution : CITY_EXPLAINERS[currentCity]} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Citizen Advisory & Risk Semicircle Gauge */}
          <div className="h-full">
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-full overflow-hidden">
              {/* Language Selector Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Health Advisory</span>
                
                {/* Language pill buttons */}
                <div className="flex gap-1">
                  {[
                    { code: 'en', name: 'EN' },
                    { code: 'hi', name: 'HI' },
                    { code: 'kn', name: 'KN' }
                  ].map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setAdvisoryLang(l.code)}
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase transition-all ${
                        advisoryLang === l.code
                          ? 'bg-slate-950 text-white'
                          : 'text-slate-400 hover:text-slate-700 bg-slate-50'
                      }`}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Semicircle gauge and translated content */}
              {detailsLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="flex-1 flex gap-4 mt-3 items-center overflow-hidden">
                  {/* Gauge Arc */}
                  <div className="flex-shrink-0">
                    <SemiCircleGauge
                      value={Math.round(advisoryToShow?.aqi || avgAqi)}
                      color={getAqiColor(advisoryToShow?.aqi || avgAqi)}
                      label={getAqiCategory(advisoryToShow?.aqi || avgAqi)}
                    />
                  </div>

                  {/* Advice text warnings */}
                  <div className="flex-1 min-w-0 h-full flex flex-col justify-center overflow-y-auto pr-1">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide mb-1 truncate">
                      {translatedTitle}
                    </h4>
                    <p className="text-[11px] font-semibold text-slate-500 leading-snug mb-2">
                      {translatedMessage}
                    </p>
                    
                    {/* Recommendation Actions list */}
                    {translatedActions.length > 0 && (
                      <ul className="space-y-0.5 mt-0.5 border-t border-slate-100 pt-1.5">
                        {translatedActions.slice(0, 3).map((action, idx) => (
                          <li key={idx} className="text-[9px] text-slate-500 font-medium flex items-start gap-1">
                            <span className="text-sky-500">•</span>
                            <span className="truncate leading-none">{action}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
