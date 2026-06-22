import { useState } from 'react'
import { getAqiInfo } from '../utils/aqiColors'

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
      severe: "गंभीर जोखिम"
    },
    messages: {
      good: "वायु गुणवत्ता {ward} में अच्छी (AQI {aqi}) रहने की उम्मीद है। बाहरी गतिविधियों का स्वतंत्र रूप से आनंद लें।",
      satisfactory: "वायु गुणवत्ता {ward} में संतोषजनक (AQI {aqi}) रहने की उम्मीद है। संवेदनशील समूहों के लिए मामूली चिंता।",
      moderate: "वायु गुणवत्ता {ward} में मध्यम (AQI {aqi}) रहने की उम्मीद है। संवेदनशील समूहों को सावधानी बरतनी चाहिए।",
      poor: "⚠️ {ward} में उच्च PM2.5 की उम्मीद है (AQI {aqi})। बाहरी गतिविधियों से बचें, विशेष रूप से सुबह 6-9 बजे और शाम 6-9 बजे।",
      verypoor: "🔴 {ward} में बहुत खराब वायु गुणवत्ता (AQI {aqi}) की उम्मीद है। सभी निवासियों को बाहरी संपर्क कम करना चाहिए।",
      severe: "🚨 {ward} के लिए गंभीर वायु गुणवत्ता चेतावनी (AQI {aqi})। घर के अंदर रहें। स्वास्थ्य आपातकाल की स्थिति।"
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
      good: "{ward} ನಲ್ಲಿ ವಾಯು ಗುಣಮಟ್ಟವು ಉತ್ತಮವಾಗಿರುತ್ತದೆ (AQI {aqi}) ನಿರೀಕ್ಷಿಸಲಾಗಿದೆ. ಹೊರಾಂಗಣ ಚಟುವಟಿಕೆಗಳನ್ನು ಮುಕ್ತವಾಗಿ ಆನಂದಿಸಿ.",
      satisfactory: "{ward} ನಲ್ಲಿ ವಾಯು ಗುಣಮಟ್ಟವು ತೃಪ್ತಿಕರವಾಗಿರುತ್ತದೆ (AQI {aqi}) ನಿರೀಕ್ಷಿಸಲಾಗಿದೆ. ಸೂಕ್ಷ್ಮ ಗುಂಪುಗಳಿಗೆ ಸಣ್ಣ ಕಾಳಜಿ.",
      moderate: "{ward} ನಲ್ಲಿ ವಾಯು ಗುಣಮಟ್ಟವು ಮಧ್ಯಮವಾಗಿರುತ್ತದೆ (AQI {aqi}) ನಿರೀಕ್ಷಿಸಲಾಗಿದೆ. ಸೂಕ್ಷ್ಮ ಗುಂಪುಗಳು ಮುನ್ನೆಚ್ಚರಿಕೆಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಬೇಕು.",
      poor: "⚠️ {ward} ನಲ್ಲಿ ಹೆಚ್ಚಿನ PM2.5 ನಿರೀಕ್ಷಿಸಲಾಗಿದೆ (AQI {aqi}). ವಿಶೇಷವಾಗಿ ಬೆಳಿಗ್ಗೆ 6-9 ಮತ್ತು ಸಂಜೆ 6-9 ರ ನಡುವೆ ಹೊರಾಂಗಣ ಚಟುವಟಿಕೆಗಳನ್ನು ತಪ್ಪಿಸಿ.",
      verypoor: "🔴 {ward} ನಲ್ಲಿ ಅತ್ಯಂತ ಕಳಪೆ ವಾಯು ಗುಣಮಟ್ಟ (AQI {aqi}) ನಿರೀಕ್ಷಿಸಲಾಗಿದೆ. ಎಲ್ಲಾ ನಿವಾಸಿಗಳು ಹೊರಾಂಗಣ ಚಟುವಟಿಕೆಯನ್ನು ಕಡಿಮೆ ಮಾಡಬೇಕು.",
      severe: "🚨 {ward} ಗಾಗಿ ಗಂಭೀರ ವಾಯು ಗುಣಮಟ್ಟದ ಎಚ್ಚರಿಕೆ (AQI {aqi}). ಮನೆಯಲ್ಲೇ ಇರಿ. ಆರೋಗ್ಯ ತುರ್ತು ಪರಿಸ್ಥಿತಿ."
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

/**
 * Citizen health advisory card with language translation support.
 */
export default function CitizenAdvisoryCard({ advisory }) {
  const [lang, setLang] = useState('en')

  if (!advisory) {
    return (
      <div className="glass-card p-4">
        <p className="text-slate-400 text-sm">No advisory available</p>
      </div>
    )
  }

  const aqiInfo = getAqiInfo(advisory.aqi)

  // Risk level colors
  const riskStyles = {
    low:      { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: '✅' },
    moderate: { bg: 'bg-yellow-50',  border: 'border-yellow-200',  text: 'text-yellow-800',  icon: '⚠️' },
    high:     { bg: 'bg-orange-50',  border: 'border-orange-200',  text: 'text-orange-800',  icon: '🟠' },
    severe:   { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-800',     icon: '🔴' },
  }

  const risk = riskStyles[advisory.risk_level] || riskStyles.moderate

  // Dynamic Translations Resolver
  let message = advisory.message
  let actions = advisory.actions || []
  let title = TRANSLATIONS[lang].title
  let riskLevelLabel = advisory.risk_level?.charAt(0).toUpperCase() + advisory.risk_level?.slice(1) + " Risk"

  if (lang !== 'en') {
    const dict = TRANSLATIONS[lang]
    // Translate title and risk level
    title = dict.title
    if (dict.risk_levels && dict.risk_levels[advisory.risk_level]) {
      riskLevelLabel = dict.risk_levels[advisory.risk_level]
    }
    // Translate message template
    if (dict.messages && dict.messages[advisory.category]) {
      message = dict.messages[advisory.category]
        .replace('{ward}', advisory.ward_name)
        .replace('{aqi}', Math.round(advisory.aqi))
    }
    // Translate actions
    if (dict.actions) {
      actions = (advisory.actions || []).map(action => dict.actions[action] || action)
    }
  }

  return (
    <div className={`rounded-2xl border ${risk.border} ${risk.bg} p-4 shadow-sm`}>
      {/* Language Selector Header */}
      <div className="flex justify-end gap-1 mb-3 border-b border-black/5 pb-2">
        {[
          { code: 'en', name: 'English' },
          { code: 'hi', name: 'हिंदी' },
          { code: 'kn', name: 'ಕನ್ನಡ' }
        ].map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase transition-all ${
              lang === l.code
                ? 'bg-slate-800 text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            {l.name}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{risk.icon}</span>
        <h4 className={`font-black text-xs uppercase tracking-wide ${risk.text}`}>
          {title} — {riskLevelLabel}
        </h4>
      </div>
      <p className={`text-sm ${risk.text} opacity-90 leading-relaxed font-medium`}>
        {message}
      </p>
      {actions.length > 0 && (
        <ul className="mt-3 space-y-1 bg-white/40 p-2.5 rounded-xl border border-black/5">
          {actions.map((action, i) => (
            <li key={i} className={`text-xs ${risk.text} opacity-80 flex items-start gap-1.5`}>
              <span className="mt-0.5">•</span>
              {action}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
