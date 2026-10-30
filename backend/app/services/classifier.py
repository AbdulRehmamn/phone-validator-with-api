import re
from typing import Optional, Dict, Any
import phonenumbers
from phonenumbers import geocoder, carrier, PhoneNumberType
from app.services.carrier_data import resolve_carrier_and_linetype, STATE_ILEC_CARRIERS

TOLL_FREE_AREA_CODES = {"800", "888", "877", "866", "855", "844", "833"}

US_STATE_ABBRS = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
    "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
    "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
    "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
    "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
    "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
    "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
    "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming",
    "DC": "District of Columbia"
}

US_STATE_NAMES_TO_ABBR = {v.lower(): k for k, v in US_STATE_ABBRS.items()}

def clean_phone_string(raw: str) -> str:
    """Strip all non-digits except a leading plus sign."""
    if not raw:
        return ""
    raw = str(raw).strip()
    has_plus = raw.startswith("+")
    digits_only = re.sub(r"[^\d]", "", raw)
    if has_plus:
        return f"+{digits_only}"
    return digits_only

class USPhoneClassifier:
    """
    Production-grade US Phone Number Validation & Classification Engine.
    Combines:
    1. NANPA rules
    2. Google libphonenumber metadata
    3. State & City geolocation mapping
    4. NANPA LERG exchange records & thousands-block pooling
       (MOBILE, LANDLINE, VOIP, FIXED_VOIP, NON_FIXED_VOIP, TOLL_FREE)
    """

    @classmethod
    def validate_and_classify(cls, raw_number: str, allow_network_lookup: bool = False) -> Dict[str, Any]:
        result = {
            "original_number": str(raw_number).strip() if raw_number is not None else "",
            "normalized_number": "",
            "formatted_national": "",
            "is_valid": False,
            "country": "United States",
            "country_code": "+1",
            "area_code": None,
            "state": None,
            "city": None,
            "carrier": None,
            "line_type": "INVALID",
            "is_mobile": False,
            "is_landline": False,
            "is_voip": False,
            "is_fixed_voip": False,
            "is_non_fixed_voip": False,
            "is_toll_free": False,
            "error_message": None
        }

        cleaned = clean_phone_string(raw_number)
        if not cleaned:
            result["error_message"] = "Empty phone number provided"
            return result

        digits = re.sub(r"[^\d]", "", cleaned)

        # Standard US NANP normalization
        if len(digits) == 10:
            e164 = f"+1{digits}"
            national_digits = digits
        elif len(digits) == 11 and digits.startswith("1"):
            e164 = f"+{digits}"
            national_digits = digits[1:]
        elif len(digits) > 11 and digits.startswith("1"):
            national_digits = digits[1:11]
            e164 = f"+1{national_digits}"
        else:
            result["error_message"] = f"Invalid digit count for US number ({len(digits)} digits, expected 10)"
            return result

        result["normalized_number"] = e164

        # NANPA Structural Checks on national 10 digits (NPA-NXX-XXXX)
        area_code = national_digits[0:3]
        co_code = national_digits[3:6]
        subscriber = national_digits[6:10]
        thousand_digit = subscriber[0] if subscriber else None

        result["area_code"] = area_code

        # NPA (Area code) cannot start with 0 or 1
        if area_code[0] in ("0", "1"):
            result["error_message"] = f"Invalid US area code '{area_code}': Area codes cannot start with 0 or 1"
            return result

        # Central Office (NXX) cannot start with 0 or 1
        if co_code[0] in ("0", "1"):
            result["error_message"] = f"Invalid central office code '{co_code}': Exchange cannot start with 0 or 1"
            return result

        # N11 codes (e.g. 911, 411, 211) cannot be used as exchange codes
        if co_code[1:] == "11":
            result["error_message"] = f"Invalid central office code '{co_code}': Reserved service code (N11)"
            return result

        # Reserved test / fictitious numbers: 555-0100 through 555-0199
        if co_code == "555" and 100 <= int(subscriber) <= 199:
            result["error_message"] = "Fictitious/test telephone number reserved by NANPA (555-01XX)"
            return result

        # Check for Toll-Free
        if area_code in TOLL_FREE_AREA_CODES:
            result["is_valid"] = True
            result["is_toll_free"] = True
            result["line_type"] = "TOLL_FREE"
            result["formatted_national"] = f"({area_code}) {co_code}-{subscriber}"
            result["country"] = "United States"
            result["carrier"] = "Toll-Free Service Provider"
            return result

        # Parse via Google libphonenumber
        try:
            parsed = phonenumbers.parse(e164, "US")
        except Exception as e:
            result["error_message"] = f"Parsing error: {str(e)}"
            return result

        if parsed.country_code != 1:
            result["error_message"] = f"Not a US number (country code +{parsed.country_code})"
            return result

        is_lib_valid = phonenumbers.is_valid_number(parsed)
        if not is_lib_valid:
            if not phonenumbers.is_possible_number(parsed):
                result["error_message"] = "Invalid US phone number: Number format is not possible under NANPA plan"
                return result
            result["error_message"] = "Unassigned or inactive US numbering block"
            return result

        # Passed validity!
        result["is_valid"] = True
        result["formatted_national"] = phonenumbers.format_number(
            parsed, phonenumbers.PhoneNumberFormat.NATIONAL
        )

        # Geolocation: State and City
        state_abbr = None
        geo_desc = geocoder.description_for_number(parsed, "en") or ""
        if geo_desc:
            if "," in geo_desc:
                parts = [p.strip() for p in geo_desc.split(",")]
                result["city"] = parts[0]
                cand = parts[1].upper()
                if cand in US_STATE_ABBRS:
                    state_abbr = cand
                    result["state"] = US_STATE_ABBRS[cand]
                else:
                    result["state"] = parts[1]
            else:
                low = geo_desc.lower()
                if low in US_STATE_NAMES_TO_ABBR:
                    state_abbr = US_STATE_NAMES_TO_ABBR[low]
                    result["state"] = US_STATE_ABBRS.get(state_abbr, geo_desc)
                else:
                    result["state"] = geo_desc

        detected_carrier = carrier.name_for_number(parsed, "en") or ""
        lib_num_type = phonenumbers.number_type(parsed)

        # Determine Carrier Name & Exact Line Type using NANPA LERG & Thousands-Block Intelligence
        resolved_carrier, resolved_line_type, rate_center = resolve_carrier_and_linetype(
            area_code=area_code,
            co_code=co_code,
            thousand_digit=thousand_digit,
            state_abbr=state_abbr,
            existing_carrier=detected_carrier,
            lib_num_type=lib_num_type,
            allow_network_lookup=allow_network_lookup
        )

        result["carrier"] = resolved_carrier
        result["line_type"] = resolved_line_type

        # Use Rate Center for City if City is empty
        if not result["city"] and rate_center:
            result["city"] = rate_center

        # Populate Boolean Flags
        if resolved_line_type == "MOBILE":
            result["is_mobile"] = True
        elif resolved_line_type == "LANDLINE":
            result["is_landline"] = True
        elif resolved_line_type == "VOIP":
            result["is_voip"] = True
        elif resolved_line_type == "FIXED_VOIP":
            result["is_voip"] = True
            result["is_fixed_voip"] = True
        elif resolved_line_type == "NON_FIXED_VOIP":
            result["is_voip"] = True
            result["is_non_fixed_voip"] = True
        elif resolved_line_type == "TOLL_FREE":
            result["is_toll_free"] = True

        return result
