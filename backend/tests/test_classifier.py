import pytest
from app.services.classifier import USPhoneClassifier

def test_toll_free():
    res = USPhoneClassifier.validate_and_classify("800-432-1000")
    assert res["is_valid"] is True
    assert res["is_toll_free"] is True
    assert res["line_type"] == "TOLL_FREE"
    assert res["area_code"] == "800"

def test_valid_geo_number():
    res = USPhoneClassifier.validate_and_classify("415-555-2671")
    assert res["is_valid"] is True
    assert res["normalized_number"] == "+14155552671"
    assert res["area_code"] == "415"
    assert res["city"] == "San Francisco"
    assert res["state"] == "California"

def test_invalid_length():
    res = USPhoneClassifier.validate_and_classify("123456")
    assert res["is_valid"] is False
    assert res["line_type"] == "INVALID"
    assert "Invalid digit count" in res["error_message"]

def test_invalid_area_code_starts_with_0():
    res = USPhoneClassifier.validate_and_classify("012-345-6789")
    assert res["is_valid"] is False
    assert res["line_type"] == "INVALID"
    assert "Area codes cannot start with 0 or 1" in res["error_message"]

def test_fictitious_555_01xx():
    res = USPhoneClassifier.validate_and_classify("212-555-0199")
    assert res["is_valid"] is False
    assert "Fictitious/test telephone number" in res["error_message"]
