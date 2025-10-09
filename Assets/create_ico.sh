#!/bin/bash
# Create a simple ICO file from PNG
python3 -c "
from PIL import Image
import sys

# Open the PNG image
img = Image.open('icon-32.png')

# Convert to RGBA if not already
if img.mode != 'RGBA':
    img = img.convert('RGBA')

# Save as ICO
img.save('icon.ico', format='ICO', sizes=[(32, 32)])
print('ICO file created successfully')
"