# 🎤 VaayuLens AI — 3-Minute Demo Talking Script

This script guide prepares presenters to deliver an engaging pitch and interactive demo of VaayuLens AI, highlighting the multi-city and multilingual capabilities.

---

## ⏱️ Timeline Outline

- **0:00 - 0:45**: The Problem & The Value Proposition (Slides/Intro)
- **0:45 - 1:45**: Live Map Dashboard, City Switching & SHAP Explainability (Demo)
- **1:45 - 2:30**: Multilingual Citizen Advisories & Multi-City Comparative Priorities (Demo)
- **2:30 - 3:00**: Technical Summary, Local Database Fallback & Q&A Wrap-up

---

## 📝 Script

### 1. Introduction & The Problem (0:00 - 0:45)
> "Good afternoon judges. Air pollution is not just a Delhi problem — it is a national urban crisis affecting millions of citizens across Mumbai, Bengaluru, and other growing hubs. But current tracking systems only tell us what *is* happening or what *has* happened. They fail to predict upcoming danger points, explain the local meteorological triggers, or communicate in local languages.
>
> Presenting **VaayuLens AI** — a multi-city, multilingual urban air quality intelligence platform. We combine ground station readings, meteorological dynamics, and spatial features to forecast AQI up to 72 hours ahead at the ward level, explain the specific factors pushing the numbers up using SHAP explainability, translate health advice into Hindi and Kannada, and rank locations by municipal enforcement priority."

### 2. Live Map Dashboard & Multi-City Switcher (0:45 - 1:45)
> *(Navigate to `http://localhost:5173/`)*
> "Here is our main dashboard. It centers on an interactive map. By default, it displays Delhi NCT, showing active monitoring stations. But watch how seamlessly we can swap cities."
> *(Use the city selector dropdown in the header to select **Mumbai** or **Bengaluru**)*
> "With one click, the map instantly fly-pans to center on Mumbai or Bengaluru, loading their unique monitoring stations. 
> Let's look at **Whitefield** in Bengaluru by clicking on the station."
> *(Click on Whitefield on the map to open the slide-in panel)*
> "The side panel slides in to show hyperlocal details. Here, we see the current AQI along with our 72-hour forecast trend. 
> But the most powerful part of VaayuLens is the **Explanation System** below. We use SHAP values, calculated directly from our Gradient Boosting model, to explain *why* the forecast looks like this. For this ward, we see that high humidity and local road dust are the primary drivers increasing the pollution risk, while a local breeze is slightly decreasing it. This translates abstract model parameters into understandable physical causes."

### 3. Multilingual Advisories & Comparative Priorities (1:45 - 2:30)
> "Next, let's look at the citizen health advisory at the bottom of the panel. Since Bengaluru is selected, we want to communicate in the local language. I'll click the language tab."
> *(Click on the **Kannada (ಕನ್ನಡ)** tab at the top of the advisory card)*
> "The advice instantly translates to Kannada, providing local citizens with actionable instructions in their primary language. We also support **Hindi (हिंदी)** for Delhi and Mumbai.
> Now, how do city administrators make decisions? We navigate to the **Priority View**."
> *(Click the "Priority" tab in the header)*
> "For government authorities, resources are limited. You cannot enforce construction bans or spray water cannons everywhere at once. VaayuLens calculates an **Enforcement Priority Score** by multiplying the forecasted AQI severity with the ward's population density.
> Swapping the city filter to **Mumbai** or **Bengaluru** instantly lists their respective stations. Stations like **Peenya** or **Sion** rise to the top because they represent the highest human exposure risk. This gives local municipal authorities a data-backed guide on where to deploy enforcement officers immediately."

### 4. Technical Summary & Close (2:30 - 3:00)
> "Under the hood, VaayuLens runs a FastAPI backend feeding a React SPA. We trained a chain of Gradient Boosted Regressors achieving a **31% improvement** over baseline persistence models. 
> Crucially, we designed the platform with a **local database fallback system**. If MongoDB is unavailable in restricted environments, the app seamlessly reads from optimized JSON cache databases, making it robust and fully functional offline.
> VaayuLens AI turns passive data collection into proactive, explainable, and actionable urban intelligence across India's major metros. Thank you, and we'd love to take your questions."
