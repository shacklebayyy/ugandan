import os
import json
from PIL import Image

def get_categories(filename):
    name = filename.lower()
    cats = []
    
    # Match keywords to categorize images
    if any(k in name for k in ['rhino', 'lion', 'elephant', 'chimp', 'giraffe']):
        cats.append('Wildlife')
    if any(k in name for k in ['drone', 'img_20170317', 'img_20180314', 'img_20180321']):
        cats.append('Drone')
    if any(k in name for k in ['landscape', 'hoima', 'dsc_6663', 'img_2016']):
        cats.append('Landscapes')
    if any(k in name for k in ['img_0074', 'img_0361', 'street']):
        cats.append('Cities')
    if any(k in name for k in ['dscn7228', 'dscn7588', 'dscn7735']):
        cats.append('Culture')
    if 'caviar' in name:
        cats.append('Commercial')
    if 'globo' in name:
        cats.append('TV Production')
    if any(k in name for k in ['catering', 'crew', 'briefing', 'security', 'driver', 'casting']):
        cats.append('Behind the Scenes')
        cats.append('TV Production')
    if any(k in name for k in ['catering', 'security', 'driver', 'casting']):
        cats.append('Services')
    if any(k in name for k in ['20180619', 'dscn7735', 'rhino', 'street']):
        cats.append('Documentary')
        
    # Fallbacks
    if not cats:
        if 'crew' in name:
            cats.append('Behind the Scenes')
        else:
            cats.append('Landscapes')
    return cats

def get_alt_text(filename):
    name = filename.lower()
    if 'catering' in name:
        return "Catering services on-location for film crews in Uganda"
    if 'driver' in name:
        return "Professional driver and 4x4 transport vehicle for filming in Uganda"
    if 'casting' in name:
        return "Casting local actors and talent for production in Uganda"
    if 'security' in name:
        return "Armed and local security services for film shoots in Uganda"
    if 'briefing' in name:
        return "Film crew briefing session before shooting a scene"
    if 'rhino' in name:
        return "Filming rhinos in Uganda's wildlife sanctuaries"
    if 'hoima' in name:
        return "Lush landscapes and rolling hills in Hoima, Uganda"
    if 'caviar' in name:
        return "Production crew shoot on set with Caviar London"
    if 'globo' in name:
        return "Brazilian TV Globo crew filming on location in Uganda"
    if 'street' in name:
        return "Behind the scenes of TV production crew filming on Kampala streets"
    if '6663' in name:
        return "Stunning landscape sunset over the hills of Uganda"
    if 'chimp' in name:
        return "Chimpanzee in Kibale Forest national park, Uganda"
    if 'giraffe' in name:
        return "Giraffes in the savanna wild plains of Uganda"
    if 'lion' in name:
        return "Lions in Queen Elizabeth National Park safari, Uganda"
    if 'elephant' in name:
        return "Wild elephants walking across the safari savannah in Uganda"
    if '0074' in name:
        return "Traffic and street life in Kampala city, Uganda"
    if '0361' in name:
        return "Bustling local market scene in Kampala city"
    if '7228' in name or '7588' in name or '7735' in name:
        return "Local Ugandan community welcoming film crew with cultural dances"
    if 'crew' in name:
        return "Professional Ugandan production crew working on set"
    return "Uganda film production location and support photos"

def get_average_color(img):
    """Calculate dominant average color as a placeholder for layout shifts"""
    small_img = img.resize((1, 1))
    color = small_img.getpixel((0, 0))
    if len(color) >= 3:
        return f"rgb({color[0]}, {color[1]}, {color[2]})"
    return "rgb(30, 30, 30)"

def process_images():
    base_dir = r"c:\Users\shackle\Documents\New folder (5)\Website fotos"
    src_dir = os.path.join(base_dir, "What we do")
    opt_dir = os.path.join(base_dir, "optimized")
    
    # Create target directories
    sizes = {
        'small': 480,
        'medium': 960,
        'large': 1920
    }
    
    for size_name in sizes:
        os.makedirs(os.path.join(opt_dir, size_name), exist_ok=True)
        
    manifest = []
    
    files = [f for f in os.listdir(src_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    print(f"Starting optimization of {len(files)} files...")
    
    for idx, filename in enumerate(sorted(files)):
        src_path = os.path.join(src_dir, filename)
        
        try:
            with Image.open(src_path) as img:
                # Convert RGBA/P to RGB if needed for JPEGs
                if img.mode in ('RGBA', 'LA', 'P'):
                    bg = Image.new('RGB', img.size, (255, 255, 255))
                    bg.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    working_img = bg
                else:
                    working_img = img.convert('RGB')
                
                orig_w, orig_h = working_img.size
                aspect_ratio = round(orig_w / orig_h, 3)
                avg_color = get_average_color(working_img)
                
                entry = {
                    'filename': filename,
                    'aspectRatio': aspect_ratio,
                    'avgColor': avg_color,
                    'categories': get_categories(filename),
                    'alt': get_alt_text(filename),
                    'width': orig_w,
                    'height': orig_h,
                    'paths': {}
                }
                
                # Save optimized versions
                for size_name, max_w in sizes.items():
                    dest_filename = os.path.splitext(filename)[0] + ".jpg"
                    dest_path = os.path.join(opt_dir, size_name, dest_filename)
                    
                    if orig_w > max_w:
                        w_percent = (max_w / float(orig_w))
                        h_size = int((float(orig_h) * float(w_percent)))
                        resized_img = working_img.resize((max_w, h_size), Image.Resampling.LANCZOS)
                    else:
                        resized_img = working_img
                    
                    # Compress and save as progressive JPEG
                    quality = 80 if size_name == 'small' else (82 if size_name == 'medium' else 85)
                    resized_img.save(dest_path, 'JPEG', quality=quality, optimize=True, progressive=True)
                    
                    # Store web path
                    entry['paths'][size_name] = f"./Website fotos/optimized/{size_name}/{dest_filename}"
                
                manifest.append(entry)
                print(f"[{idx+1}/{len(files)}] Optimized {filename} successfully.")
        except Exception as e:
            print(f"Error optimizing {filename}: {e}")
            
    # Save manifest.json
    manifest_path = os.path.join(opt_dir, "manifest.json")
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
        
    print(f"Manifest written successfully to: {manifest_path}")

if __name__ == "__main__":
    process_images()
