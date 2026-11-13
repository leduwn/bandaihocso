from PIL import Image
import numpy as np

img = Image.open("public/uploads/ban-dai-hoc-so-logo.png").convert("RGBA")
data = np.array(img)

# White or near white background (R>245, G>245, B>245)
r, g, b, a = data.T
white_areas = (r > 240) & (g > 240) & (b > 240)
data[..., 3][white_areas.T] = 0

clean_img = Image.fromarray(data)

# Get bounding box of non-transparent pixels
bbox = clean_img.getbbox()
print("Original size:", img.size)
print("Content bounding box:", bbox)

if bbox:
    # Add a small padding (e.g. 10px)
    pad = 10
    left = max(0, bbox[0] - pad)
    top = max(0, bbox[1] - pad)
    right = min(img.width, bbox[2] + pad)
    bottom = min(img.height, bbox[3] + pad)
    cropped = clean_img.crop((left, top, right, bottom))
    print("Cropped size:", cropped.size)
    cropped.save("public/uploads/ban-dai-hoc-so-logo-clean.png")
    print("Saved clean cropped logo!")
