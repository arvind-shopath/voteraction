"""
VoterAction PDF Parser v2 - ECI Electoral Roll Parser
======================================================
Cover Page Parser (Module 2 from SRS):
  - Page 1 से Part Number, Booth Name, Address extract करना

Voter Card Parser (Module 3 from SRS):
  - Page 2+ से voter cards parse करना

Primary Method: pdfplumber (no OCR needed for text-layer ECI PDFs)
Fallback: pytesseract OCR (for scanned image PDFs)
"""

import sys
import json
import re
import os

# ---- DEPENDENCY LOADER ----
try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False
    sys.stderr.write("[FATAL] pdfplumber not installed! Run: pip install pdfplumber\n")
    sys.exit(1)

try:
    import fitz  # PyMuPDF
    HAS_FITZ = True
except ImportError:
    HAS_FITZ = False

try:
    import pytesseract
    from PIL import Image
    import cv2
    import numpy as np
    from pdf2image import convert_from_path
    HAS_OCR = True
    if sys.platform == 'win32':
        for tpath in [
            r'C:\Program Files\Tesseract-OCR\tesseract.exe',
            r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
        ]:
            if os.path.exists(tpath):
                pytesseract.pytesseract.tesseract_cmd = tpath
                break
except ImportError:
    HAS_OCR = False


# ================================================================
# MODULE 2: COVER PAGE PARSER
# SRS: Page 1 से पोलिंग बूथ का पूरा address निकालना
# ================================================================

def parse_cover_page(pdf_path):
    """
    ECI PDF के Page 1 (Cover Page) से निकालें:
    - part_no (भाग संख्या)
    - assembly_no (विधानसभा संख्या)
    - assembly_name (विधानसभा नाम)
    - booth_name (मतदान केंद्र का नाम व भवन)
    - area_locality (मुख्य ग्राम / मोहल्ला)
    - police_station (थाना)
    - tehsil (तहसील)
    - pincode (पिन कोड)
    - district (जिला)
    """
    booth_info = {
        "part_no": None,
        "assembly_no": None,
        "assembly_name": "",
        "booth_name": "",
        "area_locality": "",        # मुख्य ग्राम/नगर (primary locality)
        "village_list": [],         # कवर पेज पर सभी अनुभागों की सूची
        "police_station": "",
        "tehsil": "",
        "pincode": "",
        "district": ""
    }

    try:
        with pdfplumber.open(pdf_path) as pdf:
            if len(pdf.pages) == 0:
                return booth_info

            # Read Page 1 (Cover Page)
            cover = pdf.pages[0]
            text = cover.extract_text(x_tolerance=3, y_tolerance=3) or ""

            if len(text.strip()) < 30:
                sys.stderr.write("--- Cover page: No text layer found ---\n")
                return booth_info

            sys.stderr.write(f"--- Cover Page text (first 300 chars): {text[:300]} ---\n")

            # ---- 1. Part Number (भाग संख्या / Part No.) ----
            part_patterns = [
                r'(?:भाग\s*संख्या|Part\s*No\.?|भाग\s*क्र\.?|Part\s*Number)\s*[:\-–]?\s*(\d+)',
                r'(?:क्रमांक|Sl\.?\s*No\.?)\s*[:\-–]?\s*(\d+)',
                r'\bPart\s*[:\-]\s*(\d+)\b',
                r'(\d+)\s*(?:भाग|Part)',
            ]
            for pat in part_patterns:
                m = re.search(pat, text, re.IGNORECASE)
                if m:
                    booth_info['part_no'] = int(m.group(1))
                    break

            # ---- 2. Assembly Number + Name (विधानसभा क्षेत्र) ----
            asm_patterns = [
                r'(?:विधानसभा\s*(?:क्षेत्र|निर्वाचन\s*क्षेत्र)|Assembly\s*(?:Constituency|Segment)?)\s*[:\-–]?\s*(\d+)\s*[-–\s]*([^\n\|]{3,60})',
                r'(\d+)\s*[-–]\s*([^\n\|]{3,50})\s*(?:विधानसभा|Assembly)',
            ]
            for pat in asm_patterns:
                m = re.search(pat, text, re.IGNORECASE)
                if m:
                    booth_info['assembly_no'] = int(m.group(1))
                    booth_info['assembly_name'] = m.group(2).strip()
                    break

            # ---- 3. Booth Name (मतदान केंद्र का नाम व भवन) ----
            booth_patterns = [
                r'(?:मतदान\s*केंद्र\s*का\s*नाम|Polling\s*Station\s*Name|मतदान\s*केन्द्र\s*का\s*नाम\s*व\s*पता|Name\s*of\s*Polling\s*Station)\s*[:\-–]?\s*([^\n]{5,150})',
                r'(?:मतदान\s*स्थल|Polling\s*Booth|Booth\s*Name)\s*[:\-–]?\s*([^\n]{5,100})',
            ]
            for pat in booth_patterns:
                m = re.search(pat, text, re.IGNORECASE)
                if m:
                    booth_info['booth_name'] = m.group(1).strip()
                    # Clean up multi-line pollution
                    booth_info['booth_name'] = re.sub(r'\s+', ' ', booth_info['booth_name'])[:200]
                    break

            # ---- 4. Village Extraction — 3 Methods ----

            # METHOD A: "मुख्य ग्राम / नगर" — सबसे precise field
            # SRS: "मुख्य ग्राम / नगर:" के आगे का नाम
            main_village_pats = [
                r'(?:मुख्य\s*ग्राम\s*[\/]\s*नगर|Main\s*Village|मुख्य\s*ग्राम|मुख्य\s*नगर)\s*[:\-–]?\s*([^\n\|]{2,80})',
                r'(?:मु\.?\s*ग्रा\.?|मु\.?\s*न\.?)\s*[:\-–]?\s*([^\n\|]{2,60})',
            ]
            for pat in main_village_pats:
                m = re.search(pat, text, re.IGNORECASE)
                if m:
                    val = m.group(1).strip()
                    val = re.sub(r'\s+', ' ', val)
                    val = re.sub(r'(?:पुलिस|थाना|जिला|Police|District|तहसील).*', '', val).strip()
                    if len(val) > 1 and not re.match(r'^[\d\s]+$', val):
                        booth_info['area_locality'] = val[:100]
                        break

            # METHOD B: "अनुभागों की संख्या और नाम" — numbered village list
            # SRS: "1. रामपुर (गांव)\n2. नया पुरवा\n3. कबीर नगर"
            village_list = []

            # Find the section block containing the list
            section_block_m = re.search(
                r'(?:अनुभागों\s*की\s*संख्या\s*(?:और|एवं|व)\s*नाम|'
                r'अनुभाग\s*(?:संख्या|नाम)|'
                r'Section\s*(?:No\.?\s*and\s*)?Name|'
                r'भाग\s*(?:का\s*)?विवरण)\s*[:\-–]?\s*\n((?:.*\n){1,20})',
                text, re.IGNORECASE
            )
            if section_block_m:
                block = section_block_m.group(1)
                # Extract numbered items: "1. रामपुर" or "1- रामपुर"
                items = re.findall(r'\d+\s*[.\-–]\s*([^\n\d][^\n]{1,60})', block)
                village_list = [re.sub(r'\s+', ' ', s.strip()) for s in items if len(s.strip()) > 1]

            if not village_list:
                # Fallback: find numbered list anywhere in cover text after "अनुभाग" keyword
                items = re.findall(
                    r'(?:^|\n)\s*\d+\s*[.\-–]\s*([^\n\d][^\n]{1,60})',
                    text
                )
                village_list = [re.sub(r'\s+', ' ', s.strip()) for s in items
                                if len(s.strip()) > 1 and not re.search(r'(?:पेज|page|भाग|part|\d{4,})', s, re.IGNORECASE)]

            # Clean & deduplicate
            seen = set()
            clean_village_list = []
            for v in village_list:
                v_clean = re.sub(r'[^\w\u0900-\u097F\s\(\)\-\/]', '', v).strip()
                if v_clean and v_clean not in seen and len(v_clean) > 1:
                    seen.add(v_clean)
                    clean_village_list.append(v_clean)

            booth_info['village_list'] = clean_village_list[:30]  # max 30 villages

            # If main village not found, use first from list
            if not booth_info['area_locality'] and clean_village_list:
                booth_info['area_locality'] = clean_village_list[0]

            sys.stderr.write(f"--- Village List ({len(clean_village_list)}): {clean_village_list[:5]} ---\n")


            # ---- 5. Police Station (थाना) ----
            ps_patterns = [
                r'(?:थाना|Police\s*Station|पुलिस\s*थाना)\s*[:\-–]?\s*([^\n\|]{3,80})',
            ]
            for pat in ps_patterns:
                m = re.search(pat, text, re.IGNORECASE)
                if m:
                    booth_info['police_station'] = m.group(1).strip()[:80]
                    break

            # ---- 6. Tehsil (तहसील) ----
            tehsil_patterns = [
                r'(?:तहसील|Tehsil|Taluka)\s*[:\-–]?\s*([^\n\|]{3,60})',
            ]
            for pat in tehsil_patterns:
                m = re.search(pat, text, re.IGNORECASE)
                if m:
                    booth_info['tehsil'] = m.group(1).strip()[:60]
                    break

            # ---- 7. Pincode (पिन कोड) ----
            pin_match = re.search(r'(?:पिन\s*(?:कोड)?|PIN\s*(?:Code)?)\s*[:\-–]?\s*(\d{6})', text, re.IGNORECASE)
            if not pin_match:
                # Fallback: any 6-digit number
                pin_match = re.search(r'\b(\d{6})\b', text)
            if pin_match:
                booth_info['pincode'] = pin_match.group(1)

            # ---- 8. District (जिला) ----
            dist_patterns = [
                r'(?:जिला|District|ज़िला)\s*[:\-–]?\s*([^\n\|\d]{3,60})',
            ]
            for pat in dist_patterns:
                m = re.search(pat, text, re.IGNORECASE)
                if m:
                    val = m.group(1).strip()
                    if len(val) > 2:
                        booth_info['district'] = val[:60]
                        break

    except Exception as e:
        sys.stderr.write(f"--- Cover Page Parse Error: {e} ---\n")

    sys.stderr.write(f"--- Cover Page Result: Part={booth_info['part_no']}, Booth={booth_info['booth_name'][:50]} ---\n")
    return booth_info


# ================================================================
# MODULE 3: VOTER CARD TEXT CLEANER
# ================================================================

def clean_val(text):
    if not text: return ""
    text = re.sub(r'\s+', ' ', text.strip())
    return text[:200]

def fix_hindi(text):
    if not text: return ""
    text = re.sub(r'\s+([ािीुूेैोौंःृ़])', r'\1', text)
    return clean_val(text)

def clean_epic(text):
    if not text: return "Unknown"
    text = text.upper().replace(' ', '').replace('\n', '')
    m = re.search(r'([A-Z]{2,4}[0-9]{5,10})', text)
    if m: return m.group(1)
    m2 = re.search(r'([A-Z]{2,3}\/[0-9]{4,})', text)
    if m2: return m2.group(1)
    if len(text) >= 7 and re.match(r'^[A-Z0-9]{7,12}$', text):
        return text[:12]
    return "Unknown"


# ================================================================
# MODULE 3: VOTER CARD PARSER
# SRS: EPIC, Name, Relative Name, House No, Age, Gender
# ================================================================

def parse_voter_block(text, page_village="", booth_info=None):
    """Parse a single voter card text block."""
    if not text or len(text.strip()) < 15:
        return None
    if re.search(r'(विलोपित|Deleted)', text, re.IGNORECASE):
        return None

    data = {
        "epic": "Unknown",
        "name": "",
        "relativeName": "",
        "relationType": "Father",
        "houseNumber": "",
        "age": 0,
        "gender": "M",
        "village": page_village,
        "boothName": booth_info.get('booth_name', '') if booth_info else '',
        "areaLocality": booth_info.get('area_locality', '') if booth_info else '',
        "policeStation": booth_info.get('police_station', '') if booth_info else '',
        "tehsil": booth_info.get('tehsil', '') if booth_info else '',
        "pincode": booth_info.get('pincode', '') if booth_info else '',
        "district": booth_info.get('district', '') if booth_info else '',
        "partNo": booth_info.get('part_no') if booth_info else None,
    }

    blob = text.replace('\n', '  ')

    # 1. EPIC Number
    epic_m = re.search(r'\b([A-Z]{2,4}[0-9]{5,10})\b', text.replace(' ', ''))
    if epic_m:
        data['epic'] = epic_m.group(1)
    else:
        epic_m2 = re.search(r'([A-Z]{2,3}\/[0-9]{5,8})', text.replace(' ', ''))
        if epic_m2:
            data['epic'] = epic_m2.group(1)

    # 2. Voter Name
    name_pats = [
        r'(?:निर्वाचक\s*का\s*नाम|Elector[\'s]*\s*Name)\s*[:\-\.]*\s*(.+?)(?=\s*(?:पिता|पति|माता|Father|Husband|Mother|मकान|House|उम्र|Age|\d{2,}))',
        r'नाम\s*[:\-\.]*\s*(.+?)(?=\s*(?:पिता|पति|माता|मकान|उम्र|आयु|\d{2,}))',
        r'Name\s*[:\-\.]*\s*(.+?)(?=\s*(?:Father|Husband|Mother|House|Age|\d{2,}))'
    ]
    for pat in name_pats:
        m = re.search(pat, blob, re.IGNORECASE)
        if m:
            data['name'] = fix_hindi(m.group(1))
            break

    # 3. Relative Name (पिता/पति/माता)
    rel_pats = [
        (r'(?:पति|Husband)\s*(?:का|की)?\s*(?:नाम)?\s*[:\u0903\-\.\s]*\s*(.+?)(?=\s*(?:मकान|House|उम्र|Age|आयु|\d{2,}|$))', 'Husband'),
        (r'(?:माता|Mother)\s*(?:का|की)?\s*(?:नाम)?\s*[:\u0903\-\.\s]*\s*(.+?)(?=\s*(?:मकान|House|उम्र|Age|आयु|\d{2,}|$))', 'Mother'),
        (r'(?:पिता|Father)\s*(?:का|की)?\s*(?:नाम)?\s*[:\u0903\-\.\s]*\s*(.+?)(?=\s*(?:मकान|House|उम्र|Age|आयु|\d{2,}|$))', 'Father'),
    ]
    for pat, rel_type in rel_pats:
        m = re.search(pat, blob, re.IGNORECASE)
        if m:
            data['relativeName'] = fix_hindi(m.group(1))
            data['relationType'] = rel_type
            break

    # 4. House Number (मकान संख्या) - SRS field
    house_m = re.search(
        r'(?:मकान\s*(?:संख्या|सं\.?|नं\.?)|House\s*(?:No\.?|Number)?)\s*[:\u0903\-\.]*\s*([A-Z0-9\-\/\.]+)',
        blob, re.IGNORECASE
    )
    if house_m:
        data['houseNumber'] = house_m.group(1).strip()
        data['houseNumber'] = re.sub(r'^0+([1-9])', r'\1', data['houseNumber'])

    # 5. Age (उम्र / आयु) - SRS field
    age_m = re.search(r'(?:उम्र|आयु|Age)\s*[:\-\.]*\s*(\d{1,3})', blob, re.IGNORECASE)
    if age_m:
        val = int(age_m.group(1))
        if 1 <= val <= 120:
            data['age'] = val

    # 6. Gender (लिंग) - SRS field
    if re.search(r'(?:महिला|Female|स्त्री)', blob, re.IGNORECASE): data['gender'] = 'F'
    elif re.search(r'(?:पुरुष|Male)\b', blob, re.IGNORECASE): data['gender'] = 'M'
    elif re.search(r'(?:तृतीय|Third)', blob, re.IGNORECASE): data['gender'] = 'T'

    if data['name'] or data['epic'] != 'Unknown':
        return data
    return None


# ================================================================
# MODULE 2+3: MAIN pdfplumber PARSER
# ================================================================

def parse_with_pdfplumber(pdf_path, start_page=1, end_page=9999):
    voters = []

    # STEP 1: Parse Cover Page (Module 2)
    sys.stderr.write("--- MODULE 2: Parsing Cover Page ---\n")
    booth_info = parse_cover_page(pdf_path)

    with pdfplumber.open(pdf_path) as pdf:
        total = len(pdf.pages)
        sys.stderr.write(f"--- Total pages: {total} ---\n")
        actual_end = min(end_page, total)

        current_village = booth_info.get('area_locality', '')
        voter_start = max(1, start_page)
        for p_idx in range(voter_start - 1, actual_end):
            page = pdf.pages[p_idx]
            p_num = p_idx + 1

            try:
                text = page.extract_text(x_tolerance=3, y_tolerance=3) or ""

                if len(text.strip()) < 30:
                    sys.stderr.write(f"--- Page {p_num}: No text layer ---\n")
                    continue

                # Check if page header has an explicit section header (e.g., "अनुभाग संख्या व नाम: 1- रामपुर")
                sec_header_match = re.search(
                    r'(?:अनुभाग\s*(?:संख्या\s*(?:और|व|एवं)\s*नाम|संख्या|नाम)|Section\s*(?:No\.?\s*and\s*Name|Name)?)\s*[:\-–]?\s*(?:\d+[\-–\s]*)?([^\n\|०-९0-9]{2,60})',
                    text[:500], re.IGNORECASE
                )
                if sec_header_match:
                    found_sec = clean_val(sec_header_match.group(1))
                    if found_sec and len(found_sec) > 1 and not re.search(r'(?:पेज|page|भाग|part)', found_sec, re.IGNORECASE):
                        current_village = found_sec

                # Split into voter blocks using multiple strategies
                blocks = []

                # Strategy A: Split by क्र.सं. (serial number)
                blocks = re.split(
                    r'(?=(?:क्र\.?\s*सं\.?|Sr\.?\s*No\.?|क्रम\s*संख्या)\s*\d+)',
                    text
                )

                if len(blocks) <= 2:
                    # Strategy B: Split by EPIC number pattern
                    blocks = re.split(r'(?=\b[A-Z]{2,4}[0-9]{5,10}\b)', text)

                if len(blocks) <= 2:
                    # Strategy C: Split every ~10-12 lines
                    lines = text.split('\n')
                    blocks = ['\n'.join(lines[i:i+12]) for i in range(0, len(lines), 10)]

                page_count = 0
                for block in blocks:
                    if len(block.strip()) < 20:
                        continue

                    # Check if block itself contains an inline Section Header update
                    block_sec_m = re.search(
                        r'(?:अनुभाग\s*(?:संख्या|नाम)|Section\s*Name)\s*[:\-–]?\s*(?:\d+[\-–\s]*)?([^\n\|]{2,60})',
                        block, re.IGNORECASE
                    )
                    if block_sec_m:
                        b_sec = clean_val(block_sec_m.group(1))
                        if b_sec and len(b_sec) > 1:
                            current_village = b_sec

                    voter = parse_voter_block(block, current_village, booth_info)
                    if voter:
                        voter['pageNumber'] = p_num
                        voters.append(voter)
                        page_count += 1

                sys.stderr.write(f"--- Page {p_num}: {page_count} voters (Village: '{current_village}') ---\n")

            except Exception as e:
                sys.stderr.write(f"--- Page {p_num} Error: {e} ---\n")
                continue

    return voters, booth_info


# ================================================================
# MAIN
# ================================================================

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: python box_parser.py <pdf_path> [start_page] [end_page]\n")
        sys.exit(1)

    pdf_path = sys.argv[1]
    start_page = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    end_page = int(sys.argv[3]) if len(sys.argv) > 3 else 9999

    if not os.path.exists(pdf_path):
        sys.stderr.write(f"[ERROR] File not found: {pdf_path}\n")
        sys.exit(1)

    sys.stderr.write(f"--- VoterAction Parser v2 ---\n")
    sys.stderr.write(f"--- File: {os.path.basename(pdf_path)} (pages {start_page}-{end_page}) ---\n")

    all_voters = []
    booth_info = {}

    if HAS_PDFPLUMBER:
        try:
            all_voters, booth_info = parse_with_pdfplumber(pdf_path, start_page, end_page)
        except Exception as e:
            sys.stderr.write(f"--- pdfplumber error: {e} ---\n")

    if len(all_voters) == 0:
        sys.stderr.write("[WARN] No voters found via pdfplumber.\n")
        if not HAS_PDFPLUMBER:
            sys.stderr.write("[FATAL] pdfplumber not installed. Run: pip install pdfplumber\n")
        sys.exit(1)

    # Output JSON: { voters: [...], booth_info: {...} }
    output = {
        "voters": all_voters,
        "booth_info": booth_info,
        "total": len(all_voters)
    }

    sys.stderr.write(f"--- TOTAL: {len(all_voters)} voters, Part={booth_info.get('part_no')}, Booth={booth_info.get('booth_name', '')[:40]} ---\n")
    print(json.dumps(output, ensure_ascii=False))
