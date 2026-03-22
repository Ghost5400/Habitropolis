import os
from rembg import remove
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

for src_name, dest_name in image_mapping.items():
    src_path = os.path.join(brain_dir, src_name)
    dest_path = os.path.join(public_dir, dest_name)
    
    print(f"Processing {src_name} -> {dest_name}...")
    try:
        input_image = Image.open(src_path)
        # Apply background removal
        output_image = remove(input_image)
        output_image.save(dest_path, "PNG")
        print(f"Successfully saved {dest_name}")
    except Exception as e:
        print(f"Failed to process {src_name}: {e}")

print("All images processed!")
