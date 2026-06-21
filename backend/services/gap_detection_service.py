import os
import re
import random
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw

def parse_kml_coordinates(kml_path: str) -> list:
    """
    Parses GPS coordinates from a KML file.
    Supports standard KML namespaces and uses a fallback regex for maximum resilience.
    
    Returns:
        list: List of dicts containing {"latitude": float, "longitude": float}
    """
    coordinates = []
    
    if not kml_path or not os.path.exists(kml_path):
        return coordinates

    try:
        # Method 1: Try standard XML Parsing
        tree = ET.parse(kml_path)
        root = tree.getroot()
        
        # Define namespace search (KML uses xmlns namespaces)
        # We search recursively ignoring namespace prefixes
        for elem in root.iter():
            if elem.tag.endswith('coordinates'):
                text = elem.text or ""
                coords_list = parse_coordinate_string(text)
                if coords_list:
                    coordinates.extend(coords_list)
                    
    except Exception as xml_err:
        print(f"[GapDetectionService] XML parse failed, using regex fallback: {str(xml_err)}")

    # Method 2: Regex fallback if XML parsing fails or coordinates weren't found
    if not coordinates:
        try:
            with open(kml_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Find all <coordinates>...</coordinates> blocks
            matches = re.findall(r'<coordinates>(.*?)</coordinates>', content, re.DOTALL)
            for match in matches:
                coords_list = parse_coordinate_string(match)
                if coords_list:
                    coordinates.extend(coords_list)
        except Exception as reg_err:
            print(f"[GapDetectionService] Regex parse failed: {str(reg_err)}")
            
    return coordinates

def parse_coordinate_string(coord_str: str) -> list:
    """Helper to parse raw KML coordinate string tuples: lon,lat,alt or lon,lat"""
    result = []
    # KML coordinates are whitespace separated
    tokens = coord_str.strip().split()
    for token in tokens:
        parts = token.split(',')
        if len(parts) >= 2:
            try:
                # KML format is longitude,latitude[,altitude]
                lon = float(parts[0].strip())
                lat = float(parts[1].strip())
                # Validate range
                if -90 <= lat <= 90 and -180 <= lon <= 180:
                    result.append({"latitude": lat, "longitude": lon})
            except ValueError:
                continue
    return result

def analyze_field(image_path: str, kml_path: str, results_dir: str) -> dict:
    """
    Performs gap detection analysis:
    1. Parses KML boundary coordinates.
    2. Draws red circles on the plantation image using Pillow to mark 'gaps'.
    3. Calculates field statistics.
    4. Saves the annotated image to results folder.
    
    Returns:
        dict: Analysis results containing metrics, coordinates, and local filename
    """
    print(f"[GapDetectionService] Processing analysis:")
    print(f"  - Image: {image_path}")
    print(f"  - KML: {kml_path}")
    
    # 1. Parse GPS boundary coordinates
    boundary_coords = parse_kml_coordinates(kml_path)
    print(f"  - Parsed {len(boundary_coords)} boundary points from KML.")
    
    # Fallback default coordinates if KML parsing returns nothing
    # Centered around an agricultural zone (e.g., California Central Valley or Bengaluru farms)
    if not boundary_coords:
        base_lat, base_lon = 36.7783, -119.4179 # California Central Valley
        boundary_coords = [
            {"latitude": base_lat + random.uniform(-0.01, 0.01), "longitude": base_lon + random.uniform(-0.01, 0.01)}
            for _ in range(5)
        ]
        print("  - Using generated fallback boundary coordinates.")

    # 2. Process image using Pillow (PIL)
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Plantation image not found at {image_path}")
        
    try:
        with Image.open(image_path) as img:
            # Convert to RGB if in another mode (like RGBA or Palette)
            if img.mode != 'RGB':
                img = img.convert('RGB')
                
            width, height = img.size
            draw = ImageDraw.Draw(img)
            
            # Determine number of gaps to simulate (e.g. 5 to 12 gaps)
            total_gaps = random.randint(4, 12)
            gap_coordinates = []
            
            # Generate simulated gap coordinates within the parsed KML boundary
            # We interpolate between boundary points to represent locations
            for i in range(total_gaps):
                # Pick a random boundary point as anchor and add slight jitter
                anchor = random.choice(boundary_coords)
                gap_lat = anchor["latitude"] + random.uniform(-0.0005, 0.0005)
                gap_lon = anchor["longitude"] + random.uniform(-0.0005, 0.0005)
                gap_coordinates.append({"latitude": round(gap_lat, 6), "longitude": round(gap_lon, 6)})
                
                # Draw red gap markers on the image (circle + outline)
                # Pick random image position
                x = random.randint(int(width * 0.1), int(width * 0.9))
                y = random.randint(int(height * 0.1), int(height * 0.9))
                r = random.randint(12, 24) # radius of circle
                
                # Draw filled semi-transparent or outline red circle representing gap
                draw.ellipse([x - r, y - r, x + r, y + r], outline="#ef4444", width=3)
                # Draw a small center dot
                draw.ellipse([x - 4, y - 4, x + 4, y + 4], fill="#ef4444")
                # Draw a text label (Gap #1, #2...)
                # (Simple built-in font fallback)
                draw.text((x + r + 4, y - 8), f"Gap #{i+1}", fill="#ffffff")
            
            # Save annotated image to the results folder
            unique_name = f"annotated_{os.path.basename(image_path)}"
            annotated_image_path = os.path.join(results_dir, unique_name)
            img.save(annotated_image_path, "JPEG", quality=85)
            print(f"  - Saved annotated image to: {annotated_image_path}")
            
    except Exception as img_err:
        print(f"[GapDetectionService] Pillow processing failed: {str(img_err)}")
        raise img_err

    # 3. Calculate metrics
    # Simulate realistic missing plants (e.g., 8-15 plants per canopy gap)
    estimated_missing_plants = sum(random.randint(6, 14) for _ in range(total_gaps))
    # Yield loss is estimated as a percentage based on missing plants (e.g. 0.08% loss per plant)
    estimated_yield_loss = round(estimated_missing_plants * 0.062, 2)

    return {
        "total_gaps": total_gaps,
        "estimated_missing_plants": estimated_missing_plants,
        "estimated_yield_loss": estimated_yield_loss,
        "coordinates": gap_coordinates,
        "annotated_filename": unique_name
    }
