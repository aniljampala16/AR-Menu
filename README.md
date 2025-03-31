# AR Menu Project

A low-cost (<$50) Augmented Reality menu system for restaurants that enhances the dining experience for both kids and adults. Diners scan a QR code on their table to access the web-based AR experience, where they can place 3D dish models directly on their table.

## Features

### For Diners

- **No App Download Required**: Works directly in mobile web browsers
- **Markerless AR**: Place dishes directly on any flat surface like your table
- **Kid-Friendly**: Fun animated characters, interactive elements, and sounds
- **Adult-Focused**: Realistic dish visualization and practical information

### For Kids (Ages 4-12)

- Animated cartoon characters (chef, dancing food) with interactive elements
- Tap characters to see "Yum!" text and hear giggle sounds
- Bright, engaging visuals to hold attention for 30+ seconds

### For Adults

- Realistic 3D dish models with subtle animations
- Clear dish information (name, description)
- Tap dishes to zoom and reveal fun facts
- Use two-finger gestures to resize and rotate the menu

### For Restaurants

- Self-service submission via Google Forms
- Low-cost implementation (<$50)
- No technical skills required to submit dishes
- Regular QR codes that simply link to your website

## Technical Details

- **Frontend**: HTML, CSS, JavaScript with A-Frame and WebXR
- **Backend**: Python for 2D-to-3D conversion
- **Hosting**: GitHub Pages (free)
- **Integration**: Google Forms and Sheets
- **Performance**: <5 second load time, <10MB total assets
- **Compatibility**: iOS 13+, Android 8.0+ on compatible devices

## Getting Started

### Prerequisites

- Modern smartphone with WebXR support
- Good lighting conditions
- Flat surface (like a table)

### Usage Instructions

1. **Access**: Scan the QR code with your phone's camera
2. **Start AR**: Tap the "Start AR" button
3. **Surface Detection**: Point your camera at your dining table
4. **Placement**: Tap the screen to place the menu
5. **Interact**:
   - Switch between dishes using the menu at the bottom
   - Tap food models for adult features (zoom, fun facts)
   - Tap character models for kid features (animation, sound)
   - Use two fingers to resize or rotate the AR menu

## For Developers

### Project Structure

```
AR-MENU/
├── images/
│   ├── processed/
│   └── raw/
├── markers/
│   ├── hiro.png
│   └── kanji.png
├── models/
│   ├── burger.gltf
│   ├── chef.gltf
│   ├── pizza_character.gltf
│   └── pizza.gltf
├── scripts/
│   ├── ar-menu.js
│   └── convert.py
├── sounds/
│   └── yum.mp3
├── styles/
│   └── main.css
├── index.html
└── README.md
```

### Setup

1. Clone this repository
2. Host on GitHub Pages or any web server
3. Generate QR code linking to your hosted URL
4. Print and place QR codes on restaurant tables

### Adding New Dishes

1. Use `convert.py` to create 3D models from food photos
2. Add models to the `models/` directory
3. Update the dish configuration in `ar-menu.js`

## License

This project is licensed under the MIT License.

## Acknowledgments

- A-Frame and WebXR for AR capabilities
- Free 3D models from Sketchfab
- Sound effects from Freesound.org