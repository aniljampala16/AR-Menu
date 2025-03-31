// AR Menu Script for Markerless AR

// Register custom components
AFRAME.registerComponent('ar-hit-test', {
    init: function () {
        this.xrHitTestSource = null;
        this.viewerSpace = null;
        this.refSpace = null;

        this.el.sceneEl.renderer.xr.addEventListener('sessionstart', this.onSessionStart.bind(this));
        this.el.sceneEl.renderer.xr.addEventListener('sessionend', this.onSessionEnd.bind(this));

        this.el.sceneEl.addEventListener('enter-vr', this.onEnterVR.bind(this));
    },

    onEnterVR: function() {
        const scene = this.el.sceneEl;
        if (!scene.is('ar-mode')) { return; }
        
        // Only display the reticle in AR mode
        this.el.setAttribute('visible', true);
        
        // Show instructions
        document.querySelector('.instructions').style.display = 'block';
    },

    onSessionStart: function() {
        const renderer = this.el.sceneEl.renderer;
        const session = renderer.xr.getSession();
        
        const element = document.getElementById('loading');
        if (element) { element.style.display = 'none'; }

        session.addEventListener('select', this.onSelect.bind(this));

        this.viewerSpace = null;
        this.refSpace = null;
        this.xrHitTestSource = null;

        session.requestReferenceSpace('viewer').then((space) => {
            this.viewerSpace = space;
            session.requestHitTestSource({space: this.viewerSpace})
                .then((hitTestSource) => {
                    this.xrHitTestSource = hitTestSource;
                });
        });

        session.requestReferenceSpace('local').then((space) => {
            this.refSpace = space;
        });
    },

    onSessionEnd: function() {
        this.viewerSpace = null;
        this.refSpace = null;
        this.xrHitTestSource = null;
    },

    onSelect: function() {
        // Place the menu when user taps the screen
        const menuContainer = document.getElementById('menu-container');
        
        if (menuContainer) {
            // Make menu visible if it's the first placement
            if (menuContainer.getAttribute('visible') === 'false') {
                menuContainer.setAttribute('visible', true);
                
                // Hide instructions after placement
                document.querySelector('.instructions').style.display = 'none';
                
                // Show menu panel
                document.querySelector('.menu-panel').style.display = 'flex';
                
                // Initialize menu with the first dish
                createDishDisplay('burger');
            }
        }
    },

    tick: function() {
        if (!this.el.sceneEl.is('ar-mode')) { return; }
        if (!this.viewerSpace || !this.refSpace || !this.xrHitTestSource) { return; }

        const frame = this.el.sceneEl.frame;
        if (!frame) { return; }

        const hitTestResults = frame.getHitTestResults(this.xrHitTestSource);
        if (hitTestResults.length > 0) {
            const pose = hitTestResults[0].getPose(this.refSpace);
            const inputMat = new THREE.Matrix4();
            inputMat.fromArray(pose.transform.matrix);

            // Set position of reticle to hit test position
            this.el.setAttribute('position', {
                x: inputMat.elements[12],
                y: inputMat.elements[13],
                z: inputMat.elements[14]
            });
            
            // Also update menu container position to match reticle
            const menuContainer = document.getElementById('menu-container');
            if (menuContainer && menuContainer.getAttribute('visible') === 'true') {
                menuContainer.setAttribute('position', {
                    x: inputMat.elements[12],
                    y: inputMat.elements[13],
                    z: inputMat.elements[14]
                });
            }
        }
    }
});

// Component for the menu container
AFRAME.registerComponent('menu-container', {
    init: function () {
        this.el.addEventListener('click', function(evt) {
            // Listen for clicks on child entities
            if (evt.detail.intersection && evt.detail.intersection.object.el) {
                const clickedEl = evt.detail.intersection.object.el;
                
                // Handle click on kid feature (character)
                if (clickedEl.classList.contains('kid-feature')) {
                    // Show "Yum!" text
                    const yumText = document.getElementById(`${clickedEl.id}-yum`);
                    if (yumText) {
                        yumText.setAttribute('visible', true);
                        
                        // Play sound
                        const sound = document.getElementById('yum-sound');
                        sound.currentTime = 0;
                        sound.play();
                        
                        // Hide text after 2 seconds
                        setTimeout(() => {
                            yumText.setAttribute('visible', false);
                        }, 2000);
                    }
                }
                
                // Handle click on adult feature (dish model)
                if (clickedEl.classList.contains('adult-feature')) {
                    // Zoom effect
                    const currentScale = clickedEl.getAttribute('scale');
                    clickedEl.setAttribute('scale', {
                        x: currentScale.x * 1.2,
                        y: currentScale.y * 1.2,
                        z: currentScale.z * 1.2
                    });
                    
                    // Show fun fact
                    const funFact = clickedEl.getAttribute('data-info');
                    const funFactEl = document.getElementById(`${clickedEl.id}-fun-fact`);
                    if (funFactEl) {
                        funFactEl.setAttribute('value', funFact);
                        funFactEl.setAttribute('visible', true);
                        
                        // Reset after 3 seconds
                        setTimeout(() => {
                            clickedEl.setAttribute('scale', currentScale);
                            funFactEl.setAttribute('visible', false);
                        }, 3000);
                    }
                }
            }
        });
    }
});

// Gesture detector for pinch zoom and rotate
AFRAME.registerComponent('gesture-detector', {
    schema: {
        element: { default: '' }
    },
    
    init: function() {
        this.targetElement = this.data.element && document.querySelector(this.data.element);
        if (!this.targetElement) {
            this.targetElement = this.el;
        }
        
        this.internalState = {
            previousState: null
        };
        
        this.emitGestureEvent = this.emitGestureEvent.bind(this);
        
        this.el.sceneEl.addEventListener('touchstart', this.onTouchStart.bind(this));
        this.el.sceneEl.addEventListener('touchmove', this.onTouchMove.bind(this));
        this.el.sceneEl.addEventListener('touchend', this.onTouchEnd.bind(this));
    },
    
    onTouchStart: function(evt) {
        if (evt.touches.length === 2) {
            this.internalState.startDistance = this.calculateDistance(
                evt.touches[0].pageX, evt.touches[0].pageY,
                evt.touches[1].pageX, evt.touches[1].pageY
            );
            this.internalState.startAngle = this.calculateAngle(
                evt.touches[0].pageX, evt.touches[0].pageY,
                evt.touches[1].pageX, evt.touches[1].pageY
            );
            this.internalState.startScale = this.getMenuScale();
            this.internalState.startRotation = this.getMenuRotation();
        }
    },
    
    onTouchMove: function(evt) {
        if (evt.touches.length === 2) {
            // Handle pinch and rotate
            const currentDistance = this.calculateDistance(
                evt.touches[0].pageX, evt.touches[0].pageY,
                evt.touches[1].pageX, evt.touches[1].pageY
            );
            const currentAngle = this.calculateAngle(
                evt.touches[0].pageX, evt.touches[0].pageY,
                evt.touches[1].pageX, evt.touches[1].pageY
            );
            
            const distanceRatio = currentDistance / this.internalState.startDistance;
            const angleDelta = currentAngle - this.internalState.startAngle;
            
            // Apply new scale
            const menuContainer = document.getElementById('menu-container');
            if (menuContainer && menuContainer.getAttribute('visible') === 'true') {
                // Scale (limited to reasonable bounds)
                const newScale = Math.min(Math.max(this.internalState.startScale * distanceRatio, 0.3), 2.0);
                menuContainer.setAttribute('scale', `${newScale} ${newScale} ${newScale}`);
                
                // Rotation (only Y axis for simplicity)
                const newRotation = this.internalState.startRotation + angleDelta;
                menuContainer.setAttribute('rotation', `0 ${newRotation} 0`);
            }
        }
    },
    
    onTouchEnd: function(evt) {
        // Reset state when touch ends
        this.internalState = {
            previousState: null
        };
    },
    
    calculateDistance: function(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },
    
    calculateAngle: function(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    },
    
    getMenuScale: function() {
        const menuContainer = document.getElementById('menu-container');
        if (menuContainer) {
            const scale = menuContainer.getAttribute('scale');
            if (scale) {
                return scale.x; // Assuming uniform scale
            }
        }
        return 1.0; // Default scale
    },
    
    getMenuRotation: function() {
        const menuContainer = document.getElementById('menu-container');
        if (menuContainer) {
            const rotation = menuContainer.getAttribute('rotation');
            if (rotation) {
                return rotation.y; // Only care about Y rotation
            }
        }
        return 0; // Default rotation
    },
    
    emitGestureEvent: function(eventName, detail) {
        const event = new CustomEvent(eventName, { detail: detail });
        this.el.dispatchEvent(event);
    }
});

// When DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Setup menu item selection
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            // Update active class
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // Get selected dish
            const dish = this.getAttribute('data-dish');
            
            // Update the displayed dish
            createDishDisplay(dish);
        });
    });
});

// Function to create or update dish display
function createDishDisplay(dishType) {
    // Clear current contents of menu container
    const menuContainer = document.getElementById('menu-container');
    while (menuContainer.firstChild) {
        menuContainer.removeChild(menuContainer.firstChild);
    }
    
    // Dish configuration
    const dishes = {
        burger: {
            name: 'Cheese Burger',
            description: 'Beef patty, cheddar, sesame bun',
            funFact: 'Made with locally sourced beef!',
            model: 'burger-model',
            characterModel: 'chef-model',
            position: '0 0.2 0',
            characterPosition: '0.5 0.2 0',
            animation: 'property: rotation; to: 0 360 0; loop: true; dur: 10000',
            characterAnimation: 'property: position; from: 0.5 0.2 0; to: 0.5 0.4 0; dur: 1000; loop: true; dir: alternate'
        },
        pizza: {
            name: 'Pepperoni Pizza',
            description: 'Tomato sauce, mozzarella, pepperoni',
            funFact: 'Our sauce uses Italian tomatoes!',
            model: 'pizza-model',
            characterModel: 'pizza-character-model',
            position: '0 0.05 0',
            characterPosition: '0.5 0.2 0',
            animation: 'property: rotation; to: 0 360 0; loop: true; dur: 12000',
            characterAnimation: 'property: rotation; to: 0 360 0; loop: true; dur: 3000'
        }
    };
    
    // Get the configuration for the selected dish
    const dish = dishes[dishType];
    
    // Create adult feature (dish model)
    const dishModel = document.createElement('a-entity');
    dishModel.setAttribute('id', `${dishType}-model-instance`);
    dishModel.setAttribute('gltf-model', `#${dish.model}`);
    dishModel.setAttribute('position', dish.position);
    dishModel.setAttribute('scale', '0.5 0.5 0.5');
    dishModel.setAttribute('animation', dish.animation);
    dishModel.setAttribute('class', 'adult-feature clickable');
    dishModel.setAttribute('data-info', dish.funFact);
    menuContainer.appendChild(dishModel);
    
    // Create kid feature (character)
    const character = document.createElement('a-entity');
    character.setAttribute('id', `${dishType}-character`);
    character.setAttribute('gltf-model', `#${dish.characterModel}`);
    character.setAttribute('position', dish.characterPosition);
    character.setAttribute('scale', '0.5 0.5 0.5');
    character.setAttribute('animation', dish.characterAnimation);
    character.setAttribute('class', 'kid-feature clickable');
    menuContainer.appendChild(character);
    
    // Create text information
    const infoEntity = document.createElement('a-entity');
    infoEntity.setAttribute('id', `${dishType}-info`);
    infoEntity.setAttribute('position', '0 -0.2 0');
    
    // Dish name
    const nameText = document.createElement('a-text');
    nameText.setAttribute('value', dish.name);
    nameText.setAttribute('color', 'white');
    nameText.setAttribute('align', 'center');
    nameText.setAttribute('width', '3');
    nameText.setAttribute('position', '0 0 0');
    infoEntity.appendChild(nameText);
    
    // Dish description
    const descText = document.createElement('a-text');
    descText.setAttribute('value', dish.description);
    descText.setAttribute('color', 'white');
    descText.setAttribute('align', 'center');
    descText.setAttribute('width', '3');
    descText.setAttribute('scale', '0.5 0.5 0.5');
    descText.setAttribute('position', '0 -0.3 0');
    infoEntity.appendChild(descText);
    
    // Fun fact text (hidden initially)
    const funFactText = document.createElement('a-text');
    funFactText.setAttribute('id', `${dishType}-model-instance-fun-fact`);
    funFactText.setAttribute('value', '');
    funFactText.setAttribute('color', 'yellow');
    funFactText.setAttribute('align', 'center');
    funFactText.setAttribute('width', '3');
    funFactText.setAttribute('scale', '0.6 0.6 0.6');
    funFactText.setAttribute('position', '0 -0.5 0');
    funFactText.setAttribute('visible', 'false');
    infoEntity.appendChild(funFactText);
    
    // Yum text for kid interaction (hidden initially)
    const yumText = document.createElement('a-text');
    yumText.setAttribute('id', `${dishType}-character-yum`);
    yumText.setAttribute('value', 'Yum!');
    yumText.setAttribute('color', 'red');
    yumText.setAttribute('align', 'center');
    yumText.setAttribute('width', '3');
    yumText.setAttribute('scale', '0.8 0.8 0.8');
    yumText.setAttribute('position', '0.5 0.6 0');
    yumText.setAttribute('visible', 'false');
    infoEntity.appendChild(yumText);
    
    menuContainer.appendChild(infoEntity);
}