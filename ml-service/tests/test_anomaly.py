"""
Unit tests for AnomalyDetector — predict() and predict_proba()
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from models.isolation_forest import AnomalyDetector

# Use a fresh detector for tests (does not touch saved models)
detector = AnomalyDetector()

NORMAL_FEATURES = {
    'delay_ratio': 0.05,
    'port_congestion': 0.2,
    'weather_severity': 0.1,
    'sentiment_score': 0.3,
    'historical_reliability': 0.9,
    'volume_change': 0.05,
}

ANOMALOUS_FEATURES = {
    'delay_ratio': 0.9,
    'port_congestion': 0.95,
    'weather_severity': 0.85,
    'sentiment_score': -0.9,
    'historical_reliability': 0.15,
    'volume_change': 0.7,
}


class TestAnomalyDetectorPredict:
    def test_returns_required_keys(self):
        result = detector.predict(NORMAL_FEATURES)
        for key in ('anomaly_score', 'is_anomaly', 'raw_score', 'confidence'):
            assert key in result

    def test_anomaly_score_in_range_0_to_100(self):
        result = detector.predict(NORMAL_FEATURES)
        assert 0 <= result['anomaly_score'] <= 100

    def test_is_anomaly_is_bool(self):
        result = detector.predict(NORMAL_FEATURES)
        assert isinstance(result['is_anomaly'], bool)

    def test_confidence_in_valid_range(self):
        result = detector.predict(NORMAL_FEATURES)
        assert 0.0 <= result['confidence'] <= 1.0

    def test_normal_features_produce_low_anomaly_score(self):
        result = detector.predict(NORMAL_FEATURES)
        assert result['anomaly_score'] < 60  # normal data should not score high

    def test_anomalous_features_produce_high_anomaly_score(self):
        result = detector.predict(ANOMALOUS_FEATURES)
        assert result['anomaly_score'] > 40  # extreme values should flag as anomalous

    def test_empty_features_uses_defaults_without_error(self):
        result = detector.predict({})
        assert 0 <= result['anomaly_score'] <= 100

    def test_raw_score_is_float(self):
        result = detector.predict(NORMAL_FEATURES)
        assert isinstance(result['raw_score'], float)


class TestPredictProba:
    def test_returns_float_between_0_and_1(self):
        prob = detector.predict_proba(NORMAL_FEATURES)
        assert isinstance(prob, float)
        assert 0.0 <= prob <= 1.0

    def test_anomalous_features_have_higher_proba_than_normal(self):
        normal_prob = detector.predict_proba(NORMAL_FEATURES)
        anomalous_prob = detector.predict_proba(ANOMALOUS_FEATURES)
        assert anomalous_prob >= normal_prob
