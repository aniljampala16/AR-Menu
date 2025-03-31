// AR Menu Interactions

document.addEventListener('DOMContentLoaded', function() {
    // Hide loading screen when A-Frame scene is loaded
    const scene = document.querySelector('a-scene');
    if (scene.hasLoaded) {
        hideLoading();
    } else {
        scene.addEventListener('loaded', hideLoading);
    }
    
    // Add interaction for adult features (dish models)
    setupAdultInteractions();
    
    // Add interaction for kid features (characters)
    setupKidInteractions();
});

// Hide loading screen
function hideLoading() {
    const loadingScreen = document.getElementById('loading');
    loadingScreen.style.display = 'none';
}

// Setup adult feature interactions (dishes with zoom and fun facts)
function setupAdultInteractions() {
    const adultFeatures = document.querySelectorAll('.adult-feature');
    
    adultFeatures.forEach(feature => {
        // Get the parent marker ID to identify which dish
        const parentMarker = feature.closest('a-marker').id;
        const funFactElement = document.getElementById(`${parentMarker.split('-')[0]}-fun-fact`);
        
        // Add click event for zoom and fun fact
        feature.addEventListener('click', function() {
            // Zoom effect
            const currentScale = feature.getAttribute('scale');
            feature.setAttribute('scale', {
                x: currentScale.x * 1.2,
                y: currentScale.y * 1.2,
                z: currentScale.z * 1.2
            });
            
            // Show fun fact
            const funFact = feature.getAttribute('data-info');
            funFactElement.setAttribute('value', funFact);
            funFactElement.setAttribute('visible', true);
            
            // Reset after 3 seconds
            setTimeout(() => {
                feature.setAttribute('scale', currentScale);
                funFactElement.setAttribute('visible', false);
            }, 3000);
        });
    });
}

// Setup kid feature interactions (characters with sounds and text)
function setupKidInteractions() {
    const kidFeatures = document.querySelectorAll('.kid-feature');
    
    kidFeatures.forEach(feature => {
        // Get the parent marker ID to identify which dish
        const parentMarker = feature.closest('a-marker').id;
        const yumTextElement = document.getElementById(`${parentMarker.split('-')[0]}-yum`);
        
        // Add click event for "Yum!" text and sound
        feature.addEventListener('click', function() {
            // Show "Yum!" text
            yumTextElement.setAttribute('visible', true);
            
            // Play sound
            const sound = document.getElementById('yum-sound');
            sound.currentTime = 0;
            sound.play();
            
            // Hide text after 2 seconds
            setTimeout(() => {
                yumTextElement.setAttribute('visible', false);
            }, 2000);
        });
    });
}