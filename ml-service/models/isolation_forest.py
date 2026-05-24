"""
Isolation Forest Anomaly Detection Model
Detects anomalous patterns in shipment data that indicate potential disruptions.
"""

import numpy as np
from sklearn.ensemble import IsolationForest
import joblib
import os


class AnomalyDetector:
    def __init__(self):
        self.model = None
        self.model_path = os.path.join(os.path.dirname(__file__), '..', 'saved_models', 'isolation_forest.pkl')
        self._initialize_model()

    def _initialize_model(self):
        """Load saved model or train a new one with synthetic data."""
        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
                print("[OK] Loaded saved Isolation Forest model")
                return
            except Exception:
                pass

        # Train with synthetic data
        self._train_with_synthetic_data()

    def _train_with_synthetic_data(self):
        """Train Isolation Forest on synthetic shipment features."""
        np.random.seed(42)
        n_samples = 1000

        # Features: [delay_ratio, port_congestion, weather_severity,
        #            sentiment_score, historical_reliability, volume_change]
        normal_data = np.column_stack([
            np.random.normal(0.1, 0.05, n_samples),    # delay_ratio (low)
            np.random.normal(0.3, 0.15, n_samples),    # port_congestion
            np.random.normal(0.2, 0.1, n_samples),     # weather_severity
            np.random.normal(0.0, 0.2, n_samples),     # sentiment (-1 to 1)
            np.random.normal(0.85, 0.1, n_samples),    # reliability (high)
            np.random.normal(0.0, 0.1, n_samples),     # volume_change
        ])

        # Add some anomalies
        n_anomalies = 50
        anomalies = np.column_stack([
            np.random.uniform(0.5, 1.0, n_anomalies),   # high delay
            np.random.uniform(0.7, 1.0, n_anomalies),   # high congestion
            np.random.uniform(0.6, 1.0, n_anomalies),   # severe weather
            np.random.uniform(-1.0, -0.5, n_anomalies), # negative sentiment
            np.random.uniform(0.2, 0.5, n_anomalies),   # low reliability
            np.random.uniform(0.3, 0.8, n_anomalies),   # high volume change
        ])

        X = np.vstack([normal_data, anomalies])
        X = np.clip(X, -1, 1)  # Ensure feature bounds

        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.05,
            random_state=42,
            max_samples='auto'
        )
        self.model.fit(X)

        # Save model
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(self.model, self.model_path)
        print("[OK] Trained and saved new Isolation Forest model")

    def predict(self, features: dict) -> dict:
        """
        Predict anomaly score for given shipment features.

        Args:
            features: dict with keys: delay_ratio, port_congestion,
                      weather_severity, sentiment_score, historical_reliability, volume_change

        Returns:
            dict with anomaly_score (0-100), is_anomaly (bool), raw_score
        """
        feature_vector = np.array([[
            features.get('delay_ratio', 0.1),
            features.get('port_congestion', 0.3),
            features.get('weather_severity', 0.2),
            features.get('sentiment_score', 0.0),
            features.get('historical_reliability', 0.85),
            features.get('volume_change', 0.0),
        ]])

        # Get anomaly score (-1 to 1, lower = more anomalous)
        raw_score = self.model.decision_function(feature_vector)[0]
        prediction = self.model.predict(feature_vector)[0]

        # Convert to 0-100 scale (higher = more risk)
        anomaly_score = max(0, min(100, int((1 - (raw_score + 0.5)) * 100)))

        return {
            'anomaly_score': anomaly_score,
            'is_anomaly': bool(prediction == -1),
            'raw_score': float(raw_score),
            'confidence': min(0.95, abs(raw_score) + 0.3)
        }

    def predict_proba(self, features: dict) -> float:
        """Return probability of disruption (0 to 1)."""
        result = self.predict(features)
        return result['anomaly_score'] / 100.0


# Singleton instance
anomaly_detector = AnomalyDetector()
