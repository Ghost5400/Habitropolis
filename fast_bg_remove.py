import os
from PIL import Image

brain_dir = r"C:\Users\Two Stars HQ\.gemini\antigravity\brain\c923a498-f6fb-4068-ba88-6c43ca15c2e1"
public_dir = r"c:\Users\Two Stars HQ\Desktop\Habitropolis\public"

image_mapping = {
    # 1st image: Standing proud
    "media__1774176479876.png": "parth.png",
    # 2nd image: Waving with water bottle
    "media__1774176583147.jpg": "parth-waving.png",
    # 3rd image: Construction hard hat
    "media__1774176719243.jpg": "parth-construction.png"
}

def remove_white_bg(img_path, output_path, tolerance=30):
    img = Image.open(img_path).convert("RGBA")
    datas = img.getdata()
    
    new_data = []
    for item in datas:
        # Check if pixel is white (or very close to white)
        # item is (R, G, B, A)
        if item[0] > 255 - tolerance and item[1] > 255 - tolerance and item[2] > 255 - tolerance:
            # Change all white (also near-white) to transparent
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")

for src_name, dest_name in image_mapping.items():
    src_path = os.path.join(brain_dir, src_name)
    dest_path = os.path.join(public_dir, dest_name)
    
    print(f"Processing {src_name} -> {dest_name}...")
    try:
        remove_white_bg(src_path, dest_path, tolerance=35) # High tolerance for edge antialiasing
        print(f"Successfully saved {dest_name}")
    except Exception as e:
        print(f"Failed to process {src_name}: {e}")

print("All images processed!")
