// Track class for a neon skyway course
class Track {
    constructor(scene, loadingManager) {
        this.scene = scene;
        this.loadingManager = loadingManager;
        this.trackMesh = null;
        this.checkpoints = [];
        this.itemBoxes = [];
        this.startPositions = [];
        this.totalLaps = 3;
        
        // Neon skyway course properties
        this.trackWidth = 20;
        this.trackLength = 1000;
        this.railingHeight = 3;
        this.trackColor = 0x000000; // Base color, overlaid with luminous striping
    }
    
    // Load track model and setup
    loadTrack(trackName) {
        if (trackName === 'neon_skyway') {
            this.createNeonSkyway();
        } else {
            console.error('Unknown track:', trackName);
        }
    }
    
    // Create the neon skyway track procedurally
    createNeonSkyway() {
        // Create track group
        this.trackGroup = new THREE.Group();
        this.scene.add(this.trackGroup);
        
        // Create the main track path
        this.createTrackPath();
        
        // Add luminous effects
        this.addLuminousEffects();
        
        // Add stars and space background
        this.createSpaceBackground();
        
        // Create checkpoints
        this.createCheckpoints();
        
        // Create starting positions
        this.createStartPositions();
        
        // Add track to scene
        this.scene.add(this.trackGroup);
    }
    
    // Create the main track path
    createTrackPath() {
        // Define track curve with twists and turns
        const trackCurve = new THREE.CurvePath();
        
        // Start with a straight section
        let startPoint = new THREE.Vector3(0, 0, 0);
        let endPoint = new THREE.Vector3(0, 0, -200);
        let curve = new THREE.LineCurve3(startPoint, endPoint);
        trackCurve.add(curve);
        
        // Add a right turn
        startPoint = endPoint.clone();
        endPoint = new THREE.Vector3(200, 0, -300);
        const controlPoint1 = new THREE.Vector3(0, 0, -300);
        const controlPoint2 = new THREE.Vector3(100, 0, -300);
        curve = new THREE.CubicBezierCurve3(startPoint, controlPoint1, controlPoint2, endPoint);
        trackCurve.add(curve);
        
        // Add a left turn with elevation
        startPoint = endPoint.clone();
        endPoint = new THREE.Vector3(150, 30, -500);
        curve = new THREE.QuadraticBezierCurve3(startPoint, new THREE.Vector3(250, 15, -400), endPoint);
        trackCurve.add(curve);
        
        // Add a corkscrew section
        startPoint = endPoint.clone();
        const corkscrewPoints = [];
        const corkscrewRadius = 50;
        const corkscrewHeight = 50;
        const corkscrewTurns = 1;
        const corkscrewSegments = 20;
        
        for (let i = 0; i <= corkscrewSegments; i++) {
            const angle = (i / corkscrewSegments) * Math.PI * 2 * corkscrewTurns;
            const x = startPoint.x + corkscrewRadius * Math.cos(angle);
            const z = startPoint.z - corkscrewRadius * Math.sin(angle);
            const y = startPoint.y + (i / corkscrewSegments) * corkscrewHeight;
            corkscrewPoints.push(new THREE.Vector3(x, y, z));
        }
        
        curve = new THREE.CatmullRomCurve3(corkscrewPoints);
        trackCurve.add(curve);
        
        // Add a downhill section
        startPoint = corkscrewPoints[corkscrewPoints.length - 1].clone();
        endPoint = new THREE.Vector3(-100, 0, -300);
        curve = new THREE.QuadraticBezierCurve3(startPoint, new THREE.Vector3(0, 40, -400), endPoint);
        trackCurve.add(curve);
        
        // Add final turn back to start
        startPoint = endPoint.clone();
        endPoint = new THREE.Vector3(0, 0, 0);
        curve = new THREE.QuadraticBezierCurve3(startPoint, new THREE.Vector3(-100, 0, -100), endPoint);
        trackCurve.add(curve);
        
        // Create track geometry
        const trackGeometry = new THREE.TubeGeometry(
            trackCurve,
            500,  // tubular segments
            this.trackWidth / 2,  // radius
            12,   // radial segments
            false // closed
        );
        
        // Create track material
        const trackMaterial = new THREE.MeshStandardMaterial({
            color: this.trackColor,
            roughness: 0.3,
            metalness: 0.7,
        });
        
        // Create track mesh
        this.trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
        this.trackMesh.receiveShadow = true;
        this.trackMesh.castShadow = true;
        this.trackGroup.add(this.trackMesh);
        
        // Store the curve for later use (checkpoints, AI navigation, etc.)
        this.trackCurve = trackCurve;
        
        // Add railings
        this.addRailings(trackCurve);
    }
    
    // Add railings to the track
    addRailings(trackCurve) {
        const railingMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            emissive: 0x333333,
            roughness: 0.5,
            metalness: 0.8
        });
        
        // Left railing
        const leftRailingGeometry = new THREE.TubeGeometry(
            trackCurve,
            500,  // tubular segments
            1,    // radius
            6,    // radial segments
            false // closed
        );
        
        const leftRailingMesh = new THREE.Mesh(leftRailingGeometry, railingMaterial);
        leftRailingMesh.position.set(this.trackWidth / 2 + 1, this.railingHeight / 2, 0);
        leftRailingMesh.castShadow = true;
        this.trackGroup.add(leftRailingMesh);
        
        // Right railing
        const rightRailingGeometry = new THREE.TubeGeometry(
            trackCurve,
            500,  // tubular segments
            1,    // radius
            6,    // radial segments
            false // closed
        );
        
        const rightRailingMesh = new THREE.Mesh(rightRailingGeometry, railingMaterial);
        rightRailingMesh.position.set(-this.trackWidth / 2 - 1, this.railingHeight / 2, 0);
        rightRailingMesh.castShadow = true;
        this.trackGroup.add(rightRailingMesh);
    }
    
        // Add luminous effects to the track
    addLuminousEffects() {
        // Create a luminous texture for the track
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        
        // Create gradient striping
        const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'red');
        gradient.addColorStop(1/6, 'orange');
        gradient.addColorStop(2/6, 'yellow');
        gradient.addColorStop(3/6, 'green');
        gradient.addColorStop(4/6, 'blue');
        gradient.addColorStop(5/6, 'indigo');
        gradient.addColorStop(1, 'violet');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Create texture from canvas
        const skywayTexture = new THREE.CanvasTexture(canvas);
        skywayTexture.wrapS = THREE.RepeatWrapping;
        skywayTexture.wrapT = THREE.RepeatWrapping;
        skywayTexture.repeat.set(50, 1);
        
        // Apply texture to track
        this.trackMesh.material.map = skywayTexture;
        this.trackMesh.material.emissiveMap = skywayTexture;
        this.trackMesh.material.emissiveIntensity = 0.3;
        this.trackMesh.material.needsUpdate = true;
        
        // Add glowing particles along the track
        this.addGlowingParticles();
    }
    
    // Add glowing particles along the track
    addGlowingParticles() {
        const particleCount = 1000;
        const particleGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        
        // Create particles along the track
        for (let i = 0; i < particleCount; i++) {
            const t = i / particleCount;
            const position = this.trackCurve.getPointAt(t);
            
            // Random offset from track center
            const tangent = this.trackCurve.getTangentAt(t);
            const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
            
            // Random position within track width
            const offset = (Math.random() - 0.5) * this.trackWidth;
            position.add(normal.multiplyScalar(offset));
            
            // Random height above track
            position.y += Math.random() * 10 + 5;
            
            // Create particle with random color
            const hue = Math.random();
            const color = new THREE.Color().setHSL(hue, 1, 0.5);
            
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.7
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(position);
            
            // Store animation parameters
            particle.userData = {
                originalY: position.y,
                phase: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random()
            };
            
            this.trackGroup.add(particle);
        }
    }
    
    // Create space background with stars
    createSpaceBackground() {
        // Create skybox
        const skyboxGeometry = new THREE.BoxGeometry(2000, 2000, 2000);
        const skyboxMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.BackSide
        });
        
        const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
        this.scene.add(skybox);
        
        // Add stars
        const starCount = 2000;
        const starGeometry = new THREE.BufferGeometry();
        const starPositions = [];
        const starColors = [];
        
        for (let i = 0; i < starCount; i++) {
            // Random position on sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const radius = 900 + Math.random() * 100;
            
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            
            starPositions.push(x, y, z);
            
            // Random star color (mostly white with some colored stars)
            const r = Math.random() > 0.9 ? Math.random() * 0.5 + 0.5 : 1;
            const g = Math.random() > 0.9 ? Math.random() * 0.5 + 0.5 : 1;
            const b = Math.random() > 0.9 ? Math.random() * 0.5 + 0.5 : 1;
            
            starColors.push(r, g, b);
        }
        
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
        starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true
        });
        
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);
        
        // Add distant planets or galaxies
        this.addDistantCelestialObjects();
    }
    
    // Add distant planets or galaxies
    addDistantCelestialObjects() {
        // Add a few distant planets
        const planetCount = 3;
        const planetGeometry = new THREE.SphereGeometry(30, 32, 32);
        
        for (let i = 0; i < planetCount; i++) {
            // Random position far away
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const radius = 800;
            
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            
            // Create planet with random color
            const hue = Math.random();
            const color = new THREE.Color().setHSL(hue, 0.7, 0.5);
            
            const planetMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.8
            });
            
            const planet = new THREE.Mesh(planetGeometry, planetMaterial);
            planet.position.set(x, y, z);
            this.scene.add(planet);
        }
    }
    
    // Create checkpoints for lap tracking
    createCheckpoints() {
        const checkpointCount = 20;
        
        for (let i = 0; i < checkpointCount; i++) {
            const t = i / checkpointCount;
            const position = this.trackCurve.getPointAt(t);
            const tangent = this.trackCurve.getTangentAt(t);
            
            // Create invisible checkpoint
            const checkpoint = {
                position: position,
                tangent: tangent,
                index: i
            };
            
            this.checkpoints.push(checkpoint);
        }
    }
    
    // Create starting positions for racers
    createStartPositions() {
        // Get position at the start of the track
        const startPosition = this.trackCurve.getPointAt(0);
        const startTangent = this.trackCurve.getTangentAt(0);
        
        // Calculate perpendicular direction to tangent
        const perpendicular = new THREE.Vector3(-startTangent.z, 0, startTangent.x).normalize();
        
        // Create 8 starting positions (4 rows of 2)
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 2; col++) {
                const position = startPosition.clone();
                
                // Offset based on row and column
                position.add(startTangent.clone().multiplyScalar(-row * 5)); // Rows are spaced 5 units apart
                position.add(perpendicular.clone().multiplyScalar((col === 0 ? -1 : 1) * 4)); // Columns are spaced 8 units apart
                
                // Add some height to ensure karts are above the track
                position.y += 1;
                
                this.startPositions.push({
                    position: position,
                    rotation: Math.atan2(startTangent.x, startTangent.z)
                });
            }
        }
    }
    
    // Get starting position for a racer
    getStartPosition(index) {
        if (index >= 0 && index < this.startPositions.length) {
            return this.startPositions[index].position;
        }
        return new THREE.Vector3(0, 1, 0);
    }
    
    // Get starting rotation for a racer
    getStartRotation(index) {
        if (index >= 0 && index < this.startPositions.length) {
            return this.startPositions[index].rotation;
        }
        return 0;
    }
    
    // Spawn item boxes on the track
    spawnItemBoxes() {
        // Create item boxes at regular intervals
        const itemBoxCount = 10;
        const itemBoxGeometry = new THREE.BoxGeometry(2, 2, 2);
        const itemBoxMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.8
        });
        
        for (let i = 0; i < itemBoxCount; i++) {
            // Place item boxes at different points along the track
            const t = (i + 0.2) / itemBoxCount; // Start a bit after the starting line
            const position = this.trackCurve.getPointAt(t);
            const tangent = this.trackCurve.getTangentAt(t);
            
            // Calculate perpendicular direction to tangent
            const perpendicular = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
            
            // Create a row of item boxes across the track
            for (let j = -1; j <= 1; j++) {
                const boxPosition = position.clone();
                boxPosition.add(perpendicular.clone().multiplyScalar(j * 5)); // Space boxes across track
                boxPosition.y += 2; // Raise boxes above track
                
                const itemBox = new THREE.Mesh(itemBoxGeometry, itemBoxMaterial);
                itemBox.position.copy(boxPosition);
                
                // Add rotation animation
                itemBox.userData = {
                    rotationSpeed: 0.02,
                    originalY: boxPosition.y,
                    bobSpeed: 1 + Math.random() * 0.5,
                    bobHeight: 0.5,
                    bobPhase: Math.random() * Math.PI * 2
                };
                
                this.scene.add(itemBox);
                this.itemBoxes.push(itemBox);
            }
        }
    }
    
    // Update track elements
    update(delta) {
        // Animate item boxes
        this.itemBoxes.forEach(itemBox => {
            // Rotate the item box
            itemBox.rotation.y += itemBox.userData.rotationSpeed;
            
            // Bob up and down
            const bobOffset = Math.sin(itemBox.userData.bobPhase) * itemBox.userData.bobHeight;
            itemBox.position.y = itemBox.userData.originalY + bobOffset;
            itemBox.userData.bobPhase += delta * itemBox.userData.bobSpeed;
        });
        
        // Animate glowing particles
        this.trackGroup.children.forEach(child => {
            if (child.userData && child.userData.hasOwnProperty('originalY')) {
                // Bob up and down
                const bobOffset = Math.sin(child.userData.phase) * 1.5;
                child.position.y = child.userData.originalY + bobOffset;
                child.userData.phase += delta * child.userData.speed;
            }
        });
    }
    
    // Check if a position is on the track
    isOnTrack(position) {
        // This is a simplified check - in a full game, we would use raycasting or more precise methods
        // Find closest point on track curve
        const closestPoint = this.getClosestPointOnTrack(position);
        
        // Calculate distance to closest point
        const distance = position.distanceTo(closestPoint);
        
        // Check if within track width
        return distance <= this.trackWidth / 2;
    }
    
    // Get closest point on track to a given position
    getClosestPointOnTrack(position) {
        // This is a simplified implementation - in a full game, we would use more efficient methods
        let closestPoint = null;
        let closestDistance = Infinity;
        
        // Sample points along the track
        const sampleCount = 100;
        
        for (let i = 0; i <= sampleCount; i++) {
            const t = i / sampleCount;
            const point = this.trackCurve.getPointAt(t);
            const distance = position.distanceTo(point);
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPoint = point;
            }
        }
        
        return closestPoint;
    }
    
    // Get track progress (0 to 1) for a given position
    getTrackProgress(position) {
        // Find closest point on track
        const closestPoint = this.getClosestPointOnTrack(position);
        
        // Find parameter t for closest point
        // This is a simplified implementation - in a full game, we would use more efficient methods
        let closestT = 0;
        let closestDistance = Infinity;
        
        const sampleCount = 100;
        
        for (let i = 0; i <= sampleCount; i++) {
            const t = i / sampleCount;
            const point = this.trackCurve.getPointAt(t);
            const distance = closestPoint.distanceTo(point);
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestT = t;
            }
        }
        
        return closestT;
    }
}
