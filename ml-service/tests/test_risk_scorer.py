"""
Unit tests for RiskScorer.calculate() and _classify_risk()
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from models.risk_scorer import RiskScorer

scorer = RiskScorer()


class TestRiskScorerCalculate:
    def test_returns_dict_with_required_keys(self):
        result = scorer.calculate(50, 50, 50, 50)
        assert 'overall_score' in result
        assert 'components' in result
        assert 'weights' in result
        assert 'confidence' in result
        assert 'risk_level' in result

    def test_overall_score_in_range(self):
        result = scorer.calculate(50, 50, 50, 50)
        assert 0 <= result['overall_score'] <= 100

    def test_all_zero_inputs_yields_low_score(self):
        result = scorer.calculate(0, 0, 0, 0)
        assert result['overall_score'] == 0

    def test_all_max_inputs_yields_max_score(self):
        result = scorer.calculate(100, 100, 100, 100)
        assert result['overall_score'] == 100

    def test_weighted_formula_is_correct(self):
        # 0.4*80 + 0.3*60 + 0.2*40 + 0.1*20 = 32+18+8+2 = 60
        result = scorer.calculate(80, 60, 40, 20)
        assert result['overall_score'] == 60

    def test_confidence_between_0_3_and_0_95(self):
        result = scorer.calculate(50, 50, 50, 50)
        assert 0.3 <= result['confidence'] <= 0.95

    def test_components_match_inputs(self):
        result = scorer.calculate(75.5, 60.0, 30.0, 20.0)
        assert result['components']['anomaly_score'] == 75.5
        assert result['components']['sentiment_risk'] == 60.0
        assert result['components']['weather_risk'] == 30.0
        assert result['components']['historical_delay'] == 20.0


class TestClassifyRisk:
    def test_critical_threshold(self):
        assert scorer._classify_risk(80) == 'critical'
        assert scorer._classify_risk(100) == 'critical'

    def test_high_threshold(self):
        assert scorer._classify_risk(60) == 'high'
        assert scorer._classify_risk(79) == 'high'

    def test_moderate_threshold(self):
        assert scorer._classify_risk(40) == 'moderate'
        assert scorer._classify_risk(59) == 'moderate'

    def test_low_threshold(self):
        assert scorer._classify_risk(20) == 'low'
        assert scorer._classify_risk(39) == 'low'

    def test_minimal_threshold(self):
        assert scorer._classify_risk(0) == 'minimal'
        assert scorer._classify_risk(19) == 'minimal'
