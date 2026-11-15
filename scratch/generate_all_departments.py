import os
import re
from collections import deque
from PIL import Image, ImageDraw, ImageFilter, ImageFont

DEPT_ASSET_MAP = {
    "General Medicine": "Blood Test.webp",
    "Family Medicine": "Common Cold.webp",
    "Geriatrics": "Parkinson's Disease.webp",
    "Cardiology": "Heart Disease.webp",
    "Neurology": "Stroke.webp",
    "Gastroenterology": "Gastritis.webp",
    "Pulmonology": "Asthma.webp",
    "Nephrology": "Kidney Disease.webp",
    "Endocrinology": "Thyroid Disorder.webp",
    "Rheumatology": "Arthritis.webp",
    "Hematology": "Anemia.webp",
    "Oncology (Medical)": "Cancer.webp",
    "Immunology & Allergy": "Allergy.webp",
    "Infectious Diseases": "Viral Infection.webp",
    "Dermatology": "Acne.webp",
    "Psychiatry": "Alzheimer's Disease.webp",
    "Hepatology": "Fatty Liver Disease.webp",
    "General Surgery": "Endoscopy.webp",
    "Orthopedics": "Bone Fracture.webp",
    "Neurosurgery": "MRI Scan.webp",
    "Cardiothoracic Surgery": "Arrhythmia.webp",
    "Vascular Surgery": "Coronary Artery Disease.webp",
    "Gastrointestinal Surgery": "Colonoscopy.webp",
    "Urology": "Kidney Stones.webp",
    "Plastic & Reconstructive Surgery": "Skin Infection.webp",
    "Pediatric Surgery": "Ultrasound Scan.webp",
    "Surgical Oncology": "PET Scan.webp",
    "Obstetrics": "Pregnancy Test.webp",
    "Gynecology": "PCOS.webp",
    "Pediatrics": "Fever.webp",
    "Neonatology": "Common Cold.webp",
    "Ophthalmology": "Glaucoma.webp",
    "ENT (Otorhinolaryngology)": "Ear Infection.webp",
    "Dentistry": "Pharyngitis.webp",
    "Orthodontics": "Tonsillitis.webp",
    "Maxillofacial Surgery": "Sinusitis.webp",
    "Sports Medicine": "Joint Pain.webp",
    "Physiotherapy & Rehabilitation": "Back Pain.webp",
    "Dietetics & Nutrition": "Obesity.webp",
    "Pain Management": "Migraine.webp",
    "Sleep Medicine": "COPD.webp",
    "Andrology": "Erectile Dysfunction.webp",
    "Audiology": "Ear Infection.webp",
    "Podiatry": "Joint Pain.webp",
    "Psychology": "Metabolic Syndrome.webp",
    "Genetics": "Blood Group Test.webp"
}

OPTIMIZED_DIR = "d:/work/medi-user/public/optimized"
OUT_DIR = "d:/work/medi-user/public/departments-images"
FONT_PATH = "C:/Windows/Fonts/segoeuib.ttf"

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text).strip('-')
    return text

def extract_fg(img_path):
    img = Image.open(img_path).convert("RGB")
    w, h = img.size
    visited = bytearray(w * h)
    q = deque()
    
    def is_bg(r, g, b):
        sat = max(r, g, b) - min(r, g, b)
        val = (r + g + b) / 3.0
        return val > 218 and sat < 18
    
    for x in range(w):
        for y in [0, h - 1]:
            r, g, b = img.getpixel((x, y))
            if is_bg(r, g, b):
                idx = y * w + x
                visited[idx] = 1
                q.append((x, y))
    for y in range(h):
        for x in [0, w - 1]:
            idx = y * w + x
            if not visited[idx]:
                r, g, b = img.getpixel((x, y))
                if is_bg(r, g, b):
                    visited[idx] = 1
                    q.append((x, y))
                    
    while q:
        cx, cy = q.popleft()
        for nx, ny in ((cx+1, cy), (cx-1, cy), (cx, cy+1), (cx, cy-1)):
            if 0 <= nx < w and 0 <= ny < h:
                nidx = ny * w + nx
                if not visited[nidx]:
                    r, g, b = img.getpixel((nx, ny))
                    if is_bg(r, g, b):
                        visited[nidx] = 1
                        q.append((nx, ny))
                        
    mask = Image.new("L", (w, h), 255)
    mask_pixels = mask.load()
    for y in range(h):
        for x in range(w):
            if visited[y * w + x]:
                mask_pixels[x, y] = 0
                
    mask_smooth = mask.filter(ImageFilter.GaussianBlur(1.0))
    rgba = img.convert("RGBA")
    rgba.putalpha(mask_smooth)
    bbox = rgba.getbbox()
    if bbox:
        return rgba.crop(bbox)
    return rgba

def render_department_card(dept_name, asset_filename, card_w=480, card_h=250):
    scale = 3
    sw, sh = card_w * scale, card_h * scale
    
    canvas = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    
    pad_x = 12 * scale
    pad_y = 10 * scale
    card_rect = [pad_x, pad_y, sw - pad_x, sh - pad_y]
    corner_radius = 24 * scale
    
    # 1. Subtle drop shadow
    shadow_layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_layer)
    s_draw.rounded_rectangle(
        [pad_x + 1 * scale, pad_y + 4 * scale, sw - pad_x - 1 * scale, sh - pad_y + 6 * scale],
        radius=corner_radius,
        fill=(15, 23, 42, 22)
    )
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(8 * scale))
    canvas.alpha_composite(shadow_layer)
    
    # 2. Card surface (White with subtle border)
    card_layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    c_draw = ImageDraw.Draw(card_layer)
    c_draw.rounded_rectangle(
        card_rect,
        radius=corner_radius,
        fill=(255, 255, 255, 255),
        outline=(226, 232, 240, 255),
        width=int(1.5 * scale)
    )
    canvas.alpha_composite(card_layer)
    
    # 3. Soft sky-blue cloud glow behind organ
    cloud_layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    cl_draw = ImageDraw.Draw(cloud_layer)
    
    cx = sw // 2
    cy = int(sh * 0.40)
    
    cloud_color = (215, 235, 252, 240)
    rw = int(75 * scale)
    rh = int(55 * scale)
    cl_draw.ellipse([cx - rw, cy - rh, cx + rw, cy + rh], fill=cloud_color)
    
    r1 = int(45 * scale)
    cl_draw.ellipse([cx - int(rw * 0.6) - r1, cy - int(rh * 0.4) - r1, cx - int(rw * 0.6) + r1, cy - int(rh * 0.4) + r1], fill=cloud_color)
    cl_draw.ellipse([cx + int(rw * 0.6) - r1, cy - int(rh * 0.4) - r1, cx + int(rw * 0.6) + r1, cy - int(rh * 0.4) + r1], fill=cloud_color)
    
    r2 = int(40 * scale)
    cl_draw.ellipse([cx - int(rw * 0.5) - r2, cy + int(rh * 0.3) - r2, cx - int(rw * 0.5) + r2, cy + int(rh * 0.3) + r2], fill=cloud_color)
    cl_draw.ellipse([cx + int(rw * 0.5) - r2, cy + int(rh * 0.3) - r2, cx + int(rw * 0.5) + r2, cy + int(rh * 0.3) + r2], fill=cloud_color)
    
    cloud_layer = cloud_layer.filter(ImageFilter.GaussianBlur(14 * scale))
    
    card_mask = Image.new("L", (sw, sh), 0)
    cm_draw = ImageDraw.Draw(card_mask)
    cm_draw.rounded_rectangle(card_rect, radius=corner_radius, fill=255)
    canvas.paste(cloud_layer, (0, 0), mask=card_mask)
    
    # 4. Organ asset
    organ_path = os.path.join(OPTIMIZED_DIR, asset_filename)
    organ_img = extract_fg(organ_path)
    ow, oh = organ_img.size
    
    max_ow = int(sw * 0.38)
    max_oh = int(sh * 0.52)
    s = min(max_ow / ow, max_oh / oh)
    now, noh = int(ow * s), int(oh * s)
    organ_res = organ_img.resize((now, noh), Image.Resampling.LANCZOS)
    
    ox = cx - now // 2
    oy = cy - noh // 2
    canvas.alpha_composite(organ_res, (ox, oy))
    
    # 5. Department Text
    font_size = int(23 * scale)
    font = ImageFont.truetype(FONT_PATH, font_size)
    
    bbox = font.getbbox(dept_name)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    
    max_tw = sw - pad_x * 2 - int(24 * scale)
    while tw > max_tw and font_size > 13 * scale:
        font_size -= int(1.5 * scale)
        font = ImageFont.truetype(FONT_PATH, font_size)
        bbox = font.getbbox(dept_name)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        
    tx = cx - tw // 2
    ty = int(sh * 0.81) - th // 2
    
    t_draw = ImageDraw.Draw(canvas)
    text_color = (15, 23, 42, 255) # Deep navy #0F172A
    t_draw.text((tx, ty), dept_name, font=font, fill=text_color)
    
    final = canvas.resize((card_w, card_h), Image.Resampling.LANCZOS)
    return final

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    total = len(DEPT_ASSET_MAP)
    print(f"Generating cards for {total} departments...")
    
    for i, (dept_name, asset_file) in enumerate(DEPT_ASSET_MAP.items(), 1):
        img = render_department_card(dept_name, asset_file)
        
        # Save primary slugified filename (e.g. cardiology.png)
        slug = slugify(dept_name)
        slug_path = os.path.join(OUT_DIR, f"{slug}.png")
        img.save(slug_path, format="PNG")
        
        # Save exact department name filename (e.g. Cardiology.png)
        # On Windows file systems, if slug == lower(dept_name), this writes the same file or creates standard alias
        exact_clean = dept_name.replace("/", "-")
        exact_path = os.path.join(OUT_DIR, f"{exact_clean}.png")
        if not os.path.exists(exact_path):
            img.save(exact_path, format="PNG")
            
        print(f"[{i}/{total}] Generated {dept_name} -> {slug}.png")
        
    print(f"Successfully generated all {total} department images in {OUT_DIR}!")

if __name__ == "__main__":
    main()
