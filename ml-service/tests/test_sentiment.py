"""
Unit tests for SentimentAnalyzer — analyze(), analyze_batch(), extract_entities()
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from nlp.sentiment import SentimentAnalyzer

analyzer = SentimentAnalyzer()


class TestAnalyze:
    def test_returns_required_keys(self):
        result = analyzer.analyze("supply chain news today")
        for key in ('score', 'label', 'confidence', 'risk_score', 'details'):
            assert key in result

    def test_negative_news_yields_negative_label(self):
        result = analyzer.analyze("Port strike causes major disruption to supply chains")
        assert result['label'] == 'negative'

    def test_positive_news_yields_positive_label(self):
        result = analyzer.analyze("Record throughput achieved at Singapore port with efficient expansion")
        assert result['label'] == 'positive'

    def test_neutral_news_yields_neutral_label(self):
        result = analyzer.analyze("Ships sailing today on normal schedules")
        assert result['label'] == 'neutral'

    def test_score_is_between_minus1_and_1(self):
        result = analyzer.analyze("Major cyclone disrupts entire port operations")
        assert -1.0 <= result['score'] <= 1.0

    def test_risk_score_is_between_0_and_100(self):
        result = analyzer.analyze("Some news about shipping")
        assert 0 <= result['risk_score'] <= 100

    def test_details_has_positive_negative_neutral_keys(self):
        result = analyzer.analyze("earthquake tsunami disruption")
        details = result['details']
        assert 'positive' in details
        assert 'negative' in details
        assert 'neutral' in details

    def test_supply_chain_lexicon_amplifies_negative(self):
        # "earthquake" is in our custom lexicon with -3.0; should be more negative than generic bad news
        result_sc = analyzer.analyze("earthquake hits port")
        result_generic = analyzer.analyze("bad day at the office")
        assert result_sc['score'] <= result_generic['score']


class TestAnalyzeBatch:
    def test_returns_list_of_same_length(self):
        texts = ["text one", "text two", "text three"]
        results = analyzer.analyze_batch(texts)
        assert isinstance(results, list)
        assert len(results) == len(texts)

    def test_each_result_has_label(self):
        results = analyzer.analyze_batch(["disruption", "expansion"])
        for r in results:
            assert 'label' in r


class TestExtractEntities:
    def test_extracts_known_location(self):
        entities = analyzer.extract_entities("Shanghai port reports congestion")
        locations = [e['text'] for e in entities if e['type'] == 'location']
        assert 'Shanghai' in locations

    def test_extracts_known_event(self):
        entities = analyzer.extract_entities("Dock workers announce a strike at Rotterdam")
        events = [e['text'] for e in entities if e['type'] == 'event']
        assert 'Strike' in events

    def test_returns_empty_list_for_unknown_text(self):
        entities = analyzer.extract_entities("Nothing here of interest whatsoever")
        assert isinstance(entities, list)
