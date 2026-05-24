"""
FastAPI endpoint tests using TestClient.
Tests all 4 ML service routes: /health, /predict, /sentiment, /whatif
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestHealth:
    def test_health_returns_200(self):
        res = client.get('/health')
        assert res.status_code == 200

    def test_health_status_is_healthy(self):
        res = client.get('/health')
        assert res.json()['status'] == 'healthy'

    def test_health_models_loaded_true(self):
        res = client.get('/health')
        assert res.json()['models_loaded'] is True


class TestPredict:
    PAYLOAD = {
        'delay_ratio': 0.3,
        'port_congestion': 0.5,
        'weather_severity': 0.4,
        'sentiment_score': -0.3,
        'historical_reliability': 0.7,
        'volume_change': 0.1,
        'weather_risk': 40,
        'historical_delay': 20,
    }

    def test_predict_returns_200(self):
        res = client.post('/predict/', json=self.PAYLOAD)
        assert res.status_code == 200

    def test_predict_has_risk_score(self):
        res = client.post('/predict/', json=self.PAYLOAD)
        body = res.json()
        assert 'risk_score' in body
        assert 0 <= body['risk_score'] <= 100

    def test_predict_has_risk_level(self):
        res = client.post('/predict/', json=self.PAYLOAD)
        assert res.json()['risk_level'] in ('minimal', 'low', 'moderate', 'high', 'critical')

    def test_predict_has_confidence(self):
        res = client.post('/predict/', json=self.PAYLOAD)
        conf = res.json()['confidence']
        assert 0.0 <= conf <= 1.0

    def test_predict_empty_body_uses_defaults(self):
        res = client.post('/predict/', json={})
        assert res.status_code == 200


class TestSentiment:
    def test_sentiment_single_text_returns_200(self):
        res = client.post('/sentiment/', json={'text': 'Port strike disrupts supply chains globally'})
        assert res.status_code == 200

    def test_sentiment_has_label(self):
        res = client.post('/sentiment/', json={'text': 'Port strike disrupts supply chains globally'})
        assert res.json()['label'] in ('positive', 'negative', 'neutral')

    def test_sentiment_has_score_in_range(self):
        res = client.post('/sentiment/', json={'text': 'Good news for shipping'})
        assert -1.0 <= res.json()['score'] <= 1.0

    def test_batch_returns_correct_count(self):
        texts = ['disruption at port', 'record expansion', 'ships sailing normally']
        res = client.post('/sentiment/batch', json={'texts': texts})
        assert res.status_code == 200
        body = res.json()
        assert body['count'] == len(texts)
        assert len(body['results']) == len(texts)


class TestWhatIf:
    PAYLOAD = {
        'portStatus': True,
        'weatherSeverity': 0.5,
        'strikeProbability': 0.3,
        'congestionLevel': 0.4,
        'region': 'Asia Pacific',
    }

    def test_whatif_returns_200(self):
        res = client.post('/whatif/', json=self.PAYLOAD)
        assert res.status_code == 200

    def test_whatif_has_simulated_risk_score(self):
        res = client.post('/whatif/', json=self.PAYLOAD)
        body = res.json()
        assert 'simulatedRiskScore' in body
        assert 0 <= body['simulatedRiskScore'] <= 100

    def test_whatif_has_recommendation(self):
        res = client.post('/whatif/', json=self.PAYLOAD)
        assert 'recommendation' in res.json()

    def test_whatif_is_simulation_flag(self):
        res = client.post('/whatif/', json=self.PAYLOAD)
        assert res.json()['isSimulation'] is True
