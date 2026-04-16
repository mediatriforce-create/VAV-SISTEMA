import sys
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw
import numpy as np

def isolate_and_glow(input_path, output_path):
    print(f"Loading image from {input_path}...")
    try:
        img = Image.open(input_path).convert("RGBA")
    except Exception as e:
        print(f"Failed to load image: {e}")
        sys.exit(1)
        
    # Convert to NumPy array for easier slicing
    data = np.array(img)
    
    # The image has a dark background. Let's find pixels that are significantly not dark.
    # We assume 'dark' is anything where R, G, B are all < 50
    # Create a boolean mask of "bright" pixels
    is_bright = (data[:,:,0] > 50) | (data[:,:,1] > 50) | (data[:,:,2] > 50)
    
    # Find bounding box of all bright pixels
    y_coords, x_coords = np.where(is_bright)
    if len(y_coords) == 0:
        print("Image is entirely dark, cannot find symbol.")
        sys.exit(1)
        
    # The logo symbol is on the left, the text is on the right. 
    # Let's find the vertical gap between the symbol and the text.
    # Sum brightness columns to find the gap.
    col_sums = is_bright.sum(axis=0)
    
    # We start from the left-most bright pixel
    min_x = np.min(x_coords)
    max_x_all = np.max(x_coords)
    
    # Find a column with 0 bright pixels after min_x
    split_x = max_x_all
    in_symbol = True
    for x in range(min_x, max_x_all):
        if col_sums[x] == 0:
            if in_symbol: # We just exited the symbol
                split_x = x
                break
                
    print(f"Symbol seems to end at x={split_x}")
    
    # If we didn't find a clear split, just guess it's the left 40% of the bounding box
    if split_x == max_x_all:
        split_x = min_x + int((max_x_all - min_x) * 0.4)
        print(f"No clear gap found. Guessing split at x={split_x}")

    # Crop the symbol
    min_y = np.min(y_coords)
    max_y = np.max(y_coords)
    
    # Add a little padding
    pad = 20
    crop_box = (
        max(0, min_x - pad),
        max(0, min_y - pad),
        min(img.width, split_x + pad),
        min(img.height, max_y + pad)
    )
    
    symbol_img = img.crop(crop_box)
    
    # We want to remove the dark background and make it transparent, 
    # but the background might be a subtle gradient.
    # Let's just create a glow effect on the existing background, or make a new transparent one.
    # To be safe, let's keep the background, but add a central radial glow behind the symbol.
    
    # Create a blank image for the glow
    glow = Image.new('RGBA', symbol_img.size, (0, 0, 0, 0))
    center_x = glow.width // 2
    center_y = glow.height // 2
    radius = min(glow.width, glow.height) // 2
    
    # Draw a radial gradient (white/yellow-ish)
    draw = ImageDraw.Draw(glow)
    for i in range(radius, 0, -2):
        alpha = int(255 * (1 - (i / radius))**3)  # Stronger center
        color = (200, 255, 100, int(alpha * 0.4)) # Pale yellow-green glow
        draw.ellipse(
            (center_x - i, center_y - i, center_x + i, center_y + i),
            fill=color
        )
    
    # Blur the glow heavily
    glow = glow.filter(ImageFilter.GaussianBlur(20))
    
    # Composite the glow OVER the cropped image (since the crop has a solid dark background)
    # Actually, if the crop has a solid background, putting glow OVER it washes it out.
    # Since we can't easily make the background transparent without edge artifacts, 
    # we'll use an additive blend or Screen blend.
    
    # Let's try to make the dark background semi-transparent so the glow can be behind.
    # Create mask: where brightness is low, alpha is 0
    s_data = np.array(symbol_img)
    brightness = s_data[:,:,0]*0.299 + s_data[:,:,1]*0.587 + s_data[:,:,2]*0.114
    
    # Pixels > 40 are visible, < 20 are transparent, smooth in between
    alpha_mask = np.clip((brightness - 20) / 20.0 * 255, 0, 255).astype(np.uint8)
    
    # Create a nice isolated icon with transparent background
    symbol_transparent = Image.fromarray(s_data)
    symbol_transparent.putalpha(Image.fromarray(alpha_mask))
    
    # Now create the final image: Dark background + Glow + Transparent Symbol
    final_img = Image.new('RGBA', symbol_img.size, (15, 15, 20, 255)) # matching the dark theme
    final_img.paste(glow, (0, 0), glow)
    final_img.paste(symbol_transparent, (0, 0), symbol_transparent)
    
    # Optional: Enhance the color of the symbol
    enhancer = ImageEnhance.Color(final_img)
    final_img = enhancer.enhance(1.3) # Boost colors a bit
    
    print(f"Saving to {output_path}...")
    final_img.save(output_path)
    print("Done!")

if __name__ == '__main__':
    in_file = r"c:\Users\media\.gemini\antigravity\brain\9f831c66-1d31-4c6b-b03b-7e20ef77b17e\uploaded_media_1772923697801.png"
    out_file = r"c:\Users\media\.gemini\antigravity\brain\9f831c66-1d31-4c6b-b03b-7e20ef77b17e\vav_logo_symbol_glow.png"
    isolate_and_glow(in_file, out_file)
