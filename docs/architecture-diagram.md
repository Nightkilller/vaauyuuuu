# Architecture & Data Flow Diagram

This document illustrates the data collection, feature engineering, model training, persistence, API serving, and visual dashboard pipelines.

```mermaid
graph TD
    %% Colors and Styles
    classDef datasource fill:#bfdbfe,stroke:#2563eb,stroke-width:2px;
    classDef processor fill:#fed7aa,stroke:#ea580c,stroke-width:2px;
    classDef storage fill:#bbf7d0,stroke:#16a34a,stroke-width:2px;
    classDef client fill:#fbcfe8,stroke:#db2777,stroke-width:2px;

    subgraph Data Layer
        A[Synthetic Data Generator]:::datasource -->|Encodes Multi-City climate features| B[(historical_data.csv)]:::storage
        W[wards.json]:::datasource -->|Delhi/Mumbai/Bengaluru station meta: Lat/Lon, pop, zones| E[Pipeline Orchestrator]
    end

    subgraph Machine Learning Pipeline
        B --> C[Feature Engineering Module]:::processor
        C -->|Creates Lags, Rolling Averages, wind decomposition| D[Training Engine]:::processor
        D -->|Validates vs Persistence| M[Trained Models model_*h.joblib]:::storage
    end

    subgraph Seeding & Orchestration
        E[Database Seeder db/seed_db.py]:::processor -->|Loads data & engineering| C
        M --> F[Inference & Explanation Engine]:::processor
        E --> F
        F -->|Generates forecasts, priority score & SHAP attributions| S[Data Seeding Handler]:::processor
    end

    subgraph Persistence Layer
        S -->|Option 1: Try MongoDB| MG[(MongoDB Atlas / Local)]:::storage
        S -->|Option 2: Fallback| FL[(Local JSON Files backend/data/seeded/)]:::storage
    end

    subgraph Application Serving
        MG -.-> API[FastAPI Web Server backend/main.py]:::processor
        FL -.-> API
    end

    subgraph Client Application
        API -->|JSON REST Endpoints with city filters| FE[React SPA frontend/]:::client
        FE -->|Renders MapView, details panel, Recharts, priorities| UI[User Browser Screen]:::client
    end
```

### Explaining the Data Flow

1. **Generation & Engineering**:
   - `generate_synthetic_data.py` executes first to construct 90 days of hourly parameters tailored to coastal Mumbai land-sea breeze, high-altitude Bengaluru moderate dynamics, and Delhi's winter thermal inversion.
   - `features.py` builds Lag features (`t-1` to `t-168`), sliding-window averages, and time-of-day sin/cos encodings.

2. **Model Training**:
   - `train_model.py` splits the dataset sequentially (first 76 days train, last 14 days test).
   - Three independent regressors are trained (forecasting $t+24$, $t+48$, and $t+72$ hours ahead) per city.
   - If LightGBM or XGBoost are missing openMP/libomp runtimes on macOS, it falls back gracefully to `HistGradientBoostingRegressor` from `scikit-learn`.

3. **SHAP & Attribution**:
   - `explain.py` uses SHAP's TreeExplainer to attribute forecasts to underlying drivers.
   - Attributions are calculated for the latest record per ward and stored as easily digestible factors.

4. **Web Delivery**:
   - `mongo_client.py` uses a connection tester to check if a database is active.
   - If MongoDB fails, it activates the `MockDatabase` layer, which reads and serves from cached files in `backend/data/seeded/`.
