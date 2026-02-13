# app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import os
from threading import Thread, Event
import time
from datetime import datetime

app = Flask(__name__)
CORS(app)

# === Config ===
file_path = os.path.join(os.path.dirname(__file__), "ML_DATASET.csv")
CACHE_REFRESH_SECONDS = 10 * 60  # refresh cache every 10 minutes

# === In-memory caches ===
cache = {
    "renewals": None,
    "new_business": None,
    "total_forecast": None,
    "comparison": None,
    "last_updated": None,
}

DATAFRAME_CACHE = None  # 🔥 store dataset in memory
stop_event = Event()


# === Helpers ===
def load_dataset(force=False):
    """Load dataset into memory. reload if force=True."""
    global DATAFRAME_CACHE
    if DATAFRAME_CACHE is None or force:
        try:
            DATAFRAME_CACHE = pd.read_csv(file_path, encoding="utf-8", on_bad_lines="skip")
            print(f"[{datetime.utcnow().isoformat()}] ✅ Dataset {'re-loaded' if force else 'loaded'} into memory.")
        except Exception as e:
            print("❌ Failed to load dataset:", e)
            if DATAFRAME_CACHE is None:
                DATAFRAME_CACHE = pd.DataFrame()
    return DATAFRAME_CACHE


def safe_int_series(s):
    """Try to coerce a series to int, ignoring bad rows."""
    return pd.to_numeric(s, errors="coerce").astype("Int64")


def linear_forecast(df, target_col, year_range):
    """Simple linear regression forecast on a given dataframe."""
    if df is None or df.empty or target_col not in df.columns:
        return [{"registrationYear": int(y), target_col: 0.0} for y in year_range]

    tmp = df[['registrationYear', target_col]].dropna()
    if tmp['registrationYear'].nunique() < 2 or tmp.shape[0] < 2:
        last_val = float(tmp[target_col].iloc[-1]) if not tmp.empty else 0.0
        return [{"registrationYear": int(y), target_col: float(last_val)} for y in year_range]

    X = tmp[['registrationYear']].astype(float)
    y = tmp[target_col].astype(float)
    try:
        model = LinearRegression()
        model.fit(X, y)
        preds = []
        for year in year_range:
            pred = model.predict([[float(year)]])[0]
            pred_val = float(max(pred, 0.0)) if np.isfinite(pred) else 0.0
            preds.append({"registrationYear": int(year), target_col: pred_val})
        return preds
    except Exception:
        last_val = float(y.iloc[-1]) if not y.empty else 0.0
        return [{"registrationYear": int(y), target_col: float(last_val)} for y in year_range]


# === Core computation ===
def compute_renewals_summary(df):
    """Compute yearly renewals."""
    dd = df[['registrationYear', 'willRenew']].dropna()
    dd['willRenew'] = dd['willRenew'].astype(str).map({'Yes': 1, 'No': 0, '1': 1, '0': 0})
    dd['registrationYear'] = safe_int_series(dd['registrationYear'])
    dd = dd.dropna(subset=['registrationYear'])
    dd['registrationYear'] = dd['registrationYear'].astype(int)

    if dd.empty:
        return pd.DataFrame(columns=['registrationYear', 'Renewals', 'TotalBusinesses', 'NonRenewals'])

    renewals_per_year = dd.groupby('registrationYear')['willRenew'].sum().reset_index(name='Renewals')
    total_per_year = dd.groupby('registrationYear')['willRenew'].count().reset_index(name='TotalBusinesses')
    summary = pd.merge(renewals_per_year, total_per_year, on='registrationYear')
    summary['NonRenewals'] = summary['TotalBusinesses'] - summary['Renewals']
    return summary.sort_values('registrationYear').reset_index(drop=True)


def compute_new_business_summary(df):
    """Compute new business per year."""
    dd = df[['registrationYear', 'businessType']].dropna()
    dd['registrationYear'] = safe_int_series(dd['registrationYear'])
    dd = dd.dropna(subset=['registrationYear'])
    dd['registrationYear'] = dd['registrationYear'].astype(int)

    if dd.empty:
        return pd.DataFrame(columns=['registrationYear', 'NewBusiness'])

    new_business = dd.groupby('registrationYear')['businessType'].count().reset_index(name='NewBusiness')
    return new_business.sort_values('registrationYear').reset_index(drop=True)


def compute_total_forecast_df(renewals_df, new_business_df):
    """Merge renewals and new business and compute totals."""
    merged = pd.merge(renewals_df, new_business_df, on='registrationYear', how='outer').fillna(0)
    merged['TotalForecast'] = merged['Renewals'].astype(float) + merged['NewBusiness'].astype(float)
    return merged[['registrationYear', 'Renewals', 'NewBusiness', 'TotalForecast']].sort_values('registrationYear').reset_index(drop=True)


def compute_comparison_df(renewals_df, new_business_df):
    """Combine for comparison view."""
    merged = pd.merge(renewals_df, new_business_df, on='registrationYear', how='outer').fillna(0)
    return merged[['registrationYear', 'Renewals', 'NewBusiness']].sort_values('registrationYear').reset_index(drop=True)


# === Compute everything and cache it ===
def compute_all_predictions(force_reload=False):
    """Compute all predictions and store in cache."""
    df = load_dataset(force=force_reload)
    if df.empty:
        print("⚠️ Dataset empty or missing.")
        return

    renewals_summary = compute_renewals_summary(df)
    new_business_summary = compute_new_business_summary(df)
    total_df = compute_total_forecast_df(renewals_summary, new_business_summary)
    comparison_df = compute_comparison_df(renewals_summary, new_business_summary)
    forecast_years = [2026]

    renew_preds = linear_forecast(renewals_summary, 'Renewals', forecast_years)
    new_preds = linear_forecast(new_business_summary, 'NewBusiness', forecast_years)
    total_preds = linear_forecast(total_df, 'TotalForecast', forecast_years)

    renewals_with_pred = pd.concat([renewals_summary, pd.DataFrame(renew_preds)], ignore_index=True)
    new_business_with_pred = pd.concat([new_business_summary, pd.DataFrame(new_preds)], ignore_index=True)
    total_with_pred = pd.concat([total_df, pd.DataFrame(total_preds)], ignore_index=True)

    merged_preds = pd.merge(pd.DataFrame(renew_preds), pd.DataFrame(new_preds), on='registrationYear', how='outer')
    comparison_with_pred = pd.concat([comparison_df, merged_preds], ignore_index=True)

    # Clean NaNs
    for df_ in [renewals_with_pred, new_business_with_pred, total_with_pred, comparison_with_pred]:
        df_.replace([np.nan, np.inf, -np.inf], 0, inplace=True)

    # Store to cache
    cache['renewals'] = {"message": "✅ Renewal prediction ready", "data": renewals_with_pred.to_dict(orient='records')}
    cache['new_business'] = {"message": "✅ New Business prediction ready", "data": new_business_with_pred.to_dict(orient='records')}
    cache['total_forecast'] = {"message": "✅ Total Forecast ready", "data": total_with_pred.to_dict(orient='records')}
    cache['comparison'] = {"message": "✅ Comparison prediction ready", "data": comparison_with_pred.to_dict(orient='records')}
    cache['last_updated'] = datetime.utcnow().isoformat()

    print(f"[{datetime.utcnow().isoformat()}] ✅ Predictions cached successfully.")


# === Background refresher ===
def start_background_tasks():
    """Continuously refresh cache every 10 minutes."""
    def refresher():
        while not stop_event.is_set():
            try:
                compute_all_predictions(force_reload=True)
            except Exception as e:
                print("❌ Error during background cache refresh:", e)
            for _ in range(int(CACHE_REFRESH_SECONDS)):
                if stop_event.is_set():
                    break
                time.sleep(1)

    t = Thread(target=refresher, daemon=True)
    t.start()
    print("🔁 Background refresher started.")


# === Flask Routes ===
@app.route('/')
def home():
    return jsonify({
        "status": "online",
        "dataset_loaded": DATAFRAME_CACHE is not None and not DATAFRAME_CACHE.empty,
        "predictions_ready": cache.get('last_updated') is not None,
        "cached_at": cache.get('last_updated'),
        "message": "✅ Flask ML API is online."
    })


@app.route('/cache-renewals')
def cached_renewals():
    return jsonify(cache.get('renewals') or {"message": "Cache empty", "data": []})


@app.route('/cache-new-business')
def cached_new_business():
    return jsonify(cache.get('new_business') or {"message": "Cache empty", "data": []})


@app.route('/cache-total-forecast')
def cached_total_forecast():
    return jsonify(cache.get('total_forecast') or {"message": "Cache empty", "data": []})


@app.route('/cache-comparison')
def cached_comparison():
    return jsonify(cache.get('comparison') or {"message": "Cache empty", "data": []})


# === Run App ===

# 🔥 Load dataset immediately
load_dataset()

# Helper to trigger initial work once
initialized = False

@app.before_request
def initialize_app():
    global initialized
    if not initialized:
        # Run computation in a background thread so we don't block the first request
        Thread(target=compute_all_predictions, daemon=True).start()
        start_background_tasks()
        initialized = True

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    print(f"🚀 Flask ML API starting on port {port}")

    try:
        app.run(host='0.0.0.0', port=port, debug=True)
    finally:
        stop_event.set()
