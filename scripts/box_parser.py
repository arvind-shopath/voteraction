
import cv2
import numpy as np
import pytesseract
from pdf2image import convert_from_path
import sys
import json
import re
import os
import fitz

# Set Tesseract config
custom_config_body = r'--oem 3 --psm 6 -l hin+eng'
custom_config_header = r'--oem 3 --psm 11 -l eng' 

def clean_val(text):
    if not text: return ""
    # Remove leading/trailing non-alphanumeric junk
    # But keep Hindi characters (\u0900-\u097F)
    text = re.sub(r'^[^\w\u0900-\u097F]+', '', text)
    text = re.sub(r'[^\w\u0900-\u097F\s\-\/]+', '', text)
    return text.strip()

def fix_broken_hindi(text):
    if not text: return ""
    # Join Matras that got separated by space (e.g. "क ु मार" -> "कुमार")
    text = re.sub(r'\s+([\u093E-\u094F\u0901-\u0903])', r'\1', text)
    # Restore some spaces between words if they are clearly separate tokens
    return clean_val(text)

def clean_epic(text):
    if not text: return "Unknown"
    text = text.upper().replace(' ', '')
    # Remove junk chars often found in EPIC line
    text = re.sub(r'[^A-Z0-9/]', '', text)
    # Standard EPIC is 3 letters + 7 digits or similar
    match = re.search(r'([A-Z]{1,4}[0-9]{4,10}|[A-Z0-9]{2,}/[0-9/]{4,})', text)
    if match:
        return match.group(1)
    if len(text) >= 6: return text[:12]
    return "Unknown"

def get_contours_logic(image):
    img_np = np.array(image)
    gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]

    # Detect Lines
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (60, 1))
    detect_horizontal = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, horizontal_kernel, iterations=2)
    vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 60))
    detect_vertical = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, vertical_kernel, iterations=2)
    
    grid = cv2.addWeighted(detect_horizontal, 0.5, detect_vertical, 0.5, 0)
    grid = cv2.dilate(grid, cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5)), iterations=3)
    
    cnts = cv2.findContours(grid, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cnts = cnts[0] if len(cnts) == 2 else cnts[1]
    
    h_img, w_img = img_np.shape[:2]
    min_area = (w_img * h_img) / 150 
    max_area = (w_img * h_img) / 5
    
    valid_boxes = []
    for c in cnts:
        x, y, w, h = cv2.boundingRect(c)
        if min_area < w*h < max_area:
             valid_boxes.append((x, y, w, h))
             
    if not valid_boxes: return [], img_np
    
    valid_boxes.sort(key=lambda b: b[1])
    rows = []
    current_row = [valid_boxes[0]]
    last_y = valid_boxes[0][1]
    row_threshold = h_img / 40
    
    for i in range(1, len(valid_boxes)):
        box = valid_boxes[i]
        if abs(box[1] - last_y) < row_threshold:
             current_row.append(box)
        else:
             current_row.sort(key=lambda b: b[0])
             rows.append(current_row)
             current_row = [box]
             last_y = box[1]
    
    if current_row:
        current_row.sort(key=lambda b: b[0])
        rows.append(current_row)
        
    final_sorted_boxes = []
    for r in rows:
        final_sorted_boxes.extend(r)
        
    return final_sorted_boxes, img_np

def parse_box_text(text):
    # Check for Deletion FIRST with more precise regex
    if re.search(r'(विलोपित|विलोभित|Deleted|वि लो पित|लोपित)', text):
        # Additional check to ensure it's not part of a name
        if not re.search(r'(नाम|निर्वाचक)\s*[:\-]*\s*(विलोपित|विलोभित)', text):
            return None

    data = {"epic": "Unknown", "name": "Unknown", "relativeName": "", "relationType": "Father", "houseNumber": "", "age": "", "gender": "M", "originalText": text}
    
    # 1. EPIC Recovery (often top line)
    lines = text.split('\n')
    header_block = " ".join(lines[:2])
    epic_match = re.search(r'([A-Z]{2,3}[A-Z0-9\/\-\.I§\}\{\]\[\(\)\#]{3,15}|[A-Z]{2,}\/[0-9\/]{3,})', header_block.replace(' ', ''))
    if epic_match:
         data['epic'] = clean_epic(epic_match.group(1))

    # 2. Field Extraction using multi-line blobs
    blob = text.replace('\n', '  ')
    
    # Name extraction
    name_re = re.search(r'(?:निर्वाचक|र्चक|चक|चक)\s*(?:का)?\s*नाम\s*[:\-\.]*\s*(.+?)(?=\s*(?:पिता|पति|माता|Relative|Father|Husband|Mother|पीटो|Photo|मकान|House|उम्र|Age))', blob)
    if name_re:
        data['name'] = fix_broken_hindi(name_re.group(1))
    elif "नाम" in blob:
        parts = re.split(r'नाम\s*[:\-\.]*', blob)
        if len(parts) > 1:
            val = re.split(r'(?:पिता|पति|माता|Relative|Father|Husband|Mother|पीटो|मकान|उम्र)', parts[1])[0]
            data['name'] = fix_broken_hindi(val)

    # Relative Name
    rel_re = re.search(r'(?:पिता|पति|माता|Father|Husband|Mother)\s*(?:का|की)?\s*(?:नाम|नास|दाम|तान)?\s*[:\-\.]*\s*(.+?)(?=\s*(?:मकान|House|Makan|पीटो|Photo|उम्र|Age|आयु|संख्या))', blob)
    if rel_re:
        label_text = rel_re.group(0)
        if any(x in label_text for x in ('पति', 'Husband')):
            data['relationType'] = 'Husband'
            data['gender'] = 'F'
        elif any(x in label_text for x in ('माता', 'Mother')):
            data['relationType'] = 'Mother'
        data['relativeName'] = fix_broken_hindi(rel_re.group(1))

    # House No
    house_re = re.search(r'(?:मकान|House|संख्या)\s*(?:संख्या|सं)?\s*[:\-\.]*\s*([A-Z0-9\-\/\$]+)', blob)
    if house_re:
        data['houseNumber'] = house_re.group(1).strip()

    # Age
    age_re = re.search(r'(?:उम्र|Age|आयु|उप्र)\s*[:\-\.]*\s*(\d+)', blob)
    if age_re:
        data['age'] = age_re.group(1)

    # Gender
    if any(x in blob for x in ('महिला', 'Female', 'Fem')): data['gender'] = 'F'
    elif any(x in blob for x in ('पुरुष', 'Male', 'Mal')): data['gender'] = 'M'
    
    return data

import gc

if __name__ == "__main__":
    try:
        pdf_path = sys.argv[1]
        start_page = int(sys.argv[2]) if len(sys.argv) > 2 else 1
        end_page = int(sys.argv[3]) if len(sys.argv) > 3 else 9999
        
        all_voters = []
        
        # Open PDF for text extraction (for Village Name accuracy)
        doc = None
        try:
            doc = fitz.open(pdf_path)
            # Validate page count
            clean_end_page = min(end_page, doc.page_count)
        except:
            clean_end_page = end_page
            pass

        # Loop through pages ONE BY ONE to save RAM
        for p_num in range(start_page, clean_end_page + 1):
            try:
                # Convert only ONE page
                # Reverting to 400 DPI since we are one-by-one, memory should be safe (~50-100MB per page)
                page_images = convert_from_path(pdf_path, dpi=400, first_page=p_num, last_page=p_num, thread_count=1)
                
                if not page_images: continue
                
                img = page_images[0] # The single image
                img_np = np.array(img)
                h_page, w_page = img_np.shape[:2]
                
                page_village = ""
                
                # 1. Try PDF Text Layer First (Fast & Accurate)
                if doc:
                    try:
                        page_text = doc[p_num-1].get_text()
                        
                        # Pattern 1: Standard Name/नाम (Section or Ward)
                        v_match = re.search(r'(?:अनुभाग|Section|वार्ड|Ward|अनुमाग).*?(?:नाम|Name|नराम)\s*[:\-]*\s*(?:\d+)?\s*[-\s]*([^\n\r]{2,60})', page_text, re.IGNORECASE)
                        if v_match:
                            val = v_match.group(1).strip()
                            page_village = clean_val(re.sub(r'^[-\s]+', '', val))
                        
                        # Pattern 2: Just after अनुभाग/वार्ड if name failed
                        if not page_village:
                             v_match = re.search(r'(?:अनुभाग|Section|वार्ड|Ward|अनुमाग)\s*(?:\d+)?\s*[-\s]*([^\n\r]{2,60})', page_text, re.IGNORECASE)
                             if v_match:
                                 val = v_match.group(1).strip()
                                 if not re.match(r'^[0-9\s/]+$', val):
                                     page_village = clean_val(re.sub(r'^[-\s]+', '', val))
                    except:
                        pass
                
                # 2. Fallback to OCR if Text Layer failed
                if not page_village:
                    top_roi = img_np[0:int(h_page * 0.15), :]
                    top_text = pytesseract.image_to_string(top_roi, lang='hin', config='--psm 6')
                    
                    v_match = re.search(r'(?:अनुभाग|Section|वार्ड|Ward|अनुमाग).*?(?:नाम|Name|नराम)\s*[:\-]*\s*(?:\d+)?\s*[-\s]*([^\n]+)', top_text, re.IGNORECASE)
                    if v_match:
                        val = v_match.group(1).strip()
                        page_village = clean_val(re.sub(r'^[-\s]+', '', val))
                    elif any(x in top_text for x in ("अनुभाग", "वार्ड")):
                        v_match = re.search(r'(?:अनुभाग|वार्ड)\s*(?:\d+)?\s*[-\s]*([^\n]+)', top_text)
                        if v_match:
                             val = v_match.group(1).strip()
                             if not re.match(r'^[0-9\s/]+$', val):
                                 page_village = clean_val(val)

                # Final Cleanup
                if page_village:
                    # Remove assembly name or part info if it leaked in
                    page_village = re.sub(r'(?:भाग|विधानसभा|निर्वाचन|संख्या|क्षेत्र).*', '', page_village).strip()
                    page_village = re.sub(r'[0-9]{2,}.*', '', page_village).strip()
                    page_village = re.sub(r'^[0-9\-\s/]+', '', page_village).strip()
                
                sys.stderr.write(f"--- Page {p_num}: Detected Village: '{page_village}' ---\n")

                boxes, _ = get_contours_logic(img)
                sys.stderr.write(f"--- Page {p_num}: Found {len(boxes)} candidate boxes ---\n")
                
                page_voters_count = 0
                for idx, (x, y, w, h) in enumerate(boxes):
                    px, py = 15, 15
                    roi = img_np[max(0, y-py):min(h_page, y+h+py), max(0, x-px):min(w_page, x+w+px)]
                    
                    # Pre-process ROI
                    enlarged = cv2.resize(roi, None, fx=2.5, fy=2.5, interpolation=cv2.INTER_CUBIC)
                    gray = cv2.cvtColor(enlarged, cv2.COLOR_BGR2GRAY)
                    
                    # Pass 1: Global Otsu
                    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
                    text = pytesseract.image_to_string(thresh, config=custom_config_body)
                    
                    voter = parse_box_text(text)
                    
                    # Pass 2 Rescue: Missing vital info
                    if voter and (voter['epic'] == "Unknown" or voter['name'] == "Unknown"):
                        adap = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 10)
                        text_alt = pytesseract.image_to_string(adap, config=custom_config_body)
                        voter_alt = parse_box_text(text_alt)
                        if voter_alt:
                            if voter['epic'] == "Unknown": voter['epic'] = voter_alt['epic']
                            if voter['name'] == "Unknown": voter['name'] = voter_alt['name']
                    
                    # Final EPIC Targeted Pass
                    if voter and voter['epic'] == "Unknown":
                        header_roi = gray[0:int(gray.shape[0]*0.4), :]
                        header_roi = cv2.threshold(header_roi, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
                        header_text = pytesseract.image_to_string(header_roi, config=custom_config_header)
                        rescued_epic = clean_epic(header_text)
                        if rescued_epic != "Unknown":
                            voter['epic'] = rescued_epic
                            
                    if voter:
                        voter['boxIndex'] = idx + 1
                        voter['pageNumber'] = p_num
                        voter['village'] = page_village 
                        if voter['name'] != "Unknown" or voter['epic'] != "Unknown":
                            all_voters.append(voter)
                            page_voters_count += 1
                
                sys.stderr.write(f"--- Page {p_num}: Successfully parsed {page_voters_count} voters ---\n")
                
                # Explicit cleanup
                img.close()
                del img
                del img_np
                del page_images
                gc.collect() # Force garbage collection
                
            except Exception as page_err:
                sys.stderr.write(f"Page {p_num} Error: {str(page_err)}\n")
                continue
        
        if doc: doc.close()
        print(json.dumps(all_voters))
        
    except Exception as e:
        sys.stderr.write(f"Error: {str(e)}")
        sys.exit(1)
