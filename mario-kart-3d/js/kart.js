// Kart class for player and AI racers
class Kart {
    constructor(scene, physics, character, isAI) {
        this.scene = scene;
        this.physics = physics;
        this.character = character;
        this.isAI = isAI;
        
        // Kart properties
        this.acceleration = isAI ? 15 : 20; // Player has better acceleration
        this.maxSpeed = isAI ? 40 : 45;     // Player has higher top speed
        this.handling = isAI ? 1.8 : 2.0;   // Player has better handling
        this.weight = character === 'heavy' ? 2.0 : 1.5;
        
        // Current state
        this.velocity = new THREE.Vector3();
        this.speed = 0;
        this.position = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        this.quaternion = new THREE.Quaternion();
        this.direction = new THREE.Vector3(0, 0, -1);
        
        // Controls state
        this.controls = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            drift: false
        };
        
        // Race state
        this.lap = 1;
        this.checkpointIndex = 0;
        this.raceTime = 0;
        this.finished = false;
        
        // Drifting state
        this.isDrifting = false;
        this.driftPower = 0;
        this.driftDirection = 0; // -1 for left, 1 for right
        this.driftBoost = 0;
        
        // Item state
        this.currentItem = null;
        this.itemCooldown = 0;
        
        // AI controller (if AI)
        this.ai = null;
        
        // Create kart model
        this.createKartModel();
    }
    
    // Create kart model
    createKartModel() {
        // For now, create a simple placeholder model
        // In a full game, we would load detailed 3D models
        
        // Create kart group
        this.kartGroup = new THREE.Group();
        
        // Create kart body
        const bodyGeometry = new THREE.BoxGeometry(2, 1, 3);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: this.character === 'sprinter' ? 0x59cb49 : 0xef5638,
            roughness: 0.5,
            metalness: 0.5
        });
        
        this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.bodyMesh.castShadow = true;
        this.bodyMesh.position.y = 0.5;
        this.kartGroup.add(this.bodyMesh);
        
        // Create character
        const characterGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const characterMaterial = new THREE.MeshStandardMaterial({
            color: this.character === 'sprinter' ? 0xffd24a : 0x37dcc6,
            roughness: 0.5,
            metalness: 0.2
        });
        
        this.characterMesh = new THREE.Mesh(characterGeometry, characterMaterial);
        this.characterMesh.castShadow = true;
        this.characterMesh.position.set(0, 1.25, -0.5);
        this.kartGroup.add(this.characterMesh);
        
        // Create wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.7,
            metalness: 0.5
        });
        
        // Front left wheel
        this.wheelFL = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.wheelFL.castShadow = true;
        this.wheelFL.rotation.z = Math.PI / 2;
        this.wheelFL.position.set(1.2, 0.4, -1);
        this.kartGroup.add(this.wheelFL);
        
        // Front right wheel
        this.wheelFR = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.wheelFR.castShadow = true;
        this.wheelFR.rotation.z = Math.PI / 2;
        this.wheelFR.position.set(-1.2, 0.4, -1);
        this.kartGroup.add(this.wheelFR);
        
        // Rear left wheel
        this.wheelRL = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.wheelRL.castShadow = true;
        this.wheelRL.rotation.z = Math.PI / 2;
        this.wheelRL.position.set(1.2, 0.4, 1);
        this.kartGroup.add(this.wheelRL);
        
        // Rear right wheel
        this.wheelRR = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.wheelRR.castShadow = true;
        this.wheelRR.rotation.z = Math.PI / 2;
        this.wheelRR.position.set(-1.2, 0.4, 1);
        this.kartGroup.add(this.wheelRR);
        
        // Add exhaust pipes
        const exhaustGeometry = new THREE.CylinderGeometry(0.1, 0.2, 0.5, 8);
        const exhaustMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.3,
            metalness: 0.8
        });
        
        // Left exhaust
        this.exhaustL = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        this.exhaustL.castShadow = true;
        this.exhaustL.rotation.x = Math.PI / 2;
        this.exhaustL.position.set(0.7, 0.5, 1.5);
        this.kartGroup.add(this.exhaustL);
        
        // Right exhaust
        this.exhaustR = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        this.exhaustR.castShadow = true;
        this.exhaustR.rotation.x = Math.PI / 2;
        this.exhaustR.position.set(-0.7, 0.5, 1.5);
        this.kartGroup.add(this.exhaustR);
        
        // Add particle emitters for exhaust
        this.createExhaustParticles();
        
        // Add drift particles
        this.createDriftParticles();
        
        // Add the kart to the scene
        this.scene.add(this.kartGroup);
    }
    
    // Create exhaust particles
    createExhaustParticles() {
        // In a full implementation, we would create particle systems for exhaust
        this.exhaustParticles = {
            active: false,
            update: function(delta) {
                // Update exhaust particles
            }
        };
    }
    
    // Create drift particles
    createDriftParticles() {
        // In a full implementation, we would create particle systems for drifting
        this.driftParticles = {
            active: false,
            update: function(delta) {
                // Update drift particles
            }
        };
    }
    
    // Spawn kart at a position with rotation
    spawn(position, rotation) {
        this.position.copy(position);
        this.rotation.y = rotation;
        this.quaternion.setFromEuler(this.rotation);
        this.direction.set(0, 0, -1).applyQuaternion(this.quaternion);
        
        // Update kart model position and rotation
        this.kartGroup.position.copy(this.position);
        this.kartGroup.rotation.y = this.rotation.y;
        
        // Reset state
        this.velocity.set(0, 0, 0);
        this.speed = 0;
        this.lap = 1;
        this.checkpointIndex = 0;
        this.raceTime = 0;
        this.finished = false;
        this.currentItem = null;
        this.itemCooldown = 0;
    }
    
    // Update kart physics and movement
    update(delta) {
        if (this.finished) return;
        
        // Update race time
        this.raceTime += delta;
        
        // Handle controls
        this.handleControls(delta);
        
        // Apply physics
        this.applyPhysics(delta);
        
        // Update position and rotation
        this.updateTransform();
        
        // Check for checkpoints and lap completion
        this.checkCheckpoints();
        
        // Update item cooldown
        if (this.itemCooldown > 0) {
            this.itemCooldown -= delta;
        }
        
        // Update particles
        this.updateParticles(delta);
    }
    
    // Handle controls input
    handleControls(delta) {
        // Skip if AI controlled
        if (this.isAI) return;
        
        // Acceleration and braking
        if (this.controls.forward) {
            this.speed += this.acceleration * delta;
        } else if (this.controls.backward) {
            this.speed -= this.acceleration * delta * 0.5; // Braking is slower than acceleration
        } else {
            // Apply friction to slow down
            this.speed *= 0.98;
        }
        
        // Clamp speed
        this.speed = Math.max(-this.maxSpeed * 0.5, Math.min(this.speed, this.maxSpeed));
        
        // Steering
        let turnFactor = this.handling * delta;
        
        // Reduce turning at low speeds
        turnFactor *= Math.min(1, Math.abs(this.speed) / 10);
        
        if (this.isDrifting) {
            // Drifting steering
            let driftTurn = turnFactor * 1.8;
            if (this.driftDirection === -1) { // Left drift
                if (this.controls.left) {
                    this.rotation.y += driftTurn * 1.5; // Turn sharper into drift
                    this.driftPower += delta * 1.5;      // Charge faster
                } else if (this.controls.right) {
                    this.rotation.y += driftTurn * 0.5; // Counter-steer
                    this.driftPower += delta * 0.5;      // Charge slower
                } else {
                    this.rotation.y += driftTurn;
                }
            } else if (this.driftDirection === 1) { // Right drift
                if (this.controls.right) {
                    this.rotation.y -= driftTurn * 1.5; // Turn sharper into drift
                    this.driftPower += delta * 1.5;      // Charge faster
                } else if (this.controls.left) {
                    this.rotation.y -= driftTurn * 0.5; // Counter-steer
                    this.driftPower += delta * 0.5;      // Charge slower
                } else {
                    this.rotation.y -= driftTurn;
                }
            }
        } else {
            // Normal steering
            if (this.controls.left) {
                this.rotation.y += turnFactor;
            }
            if (this.controls.right) {
                this.rotation.y -= turnFactor;
            }
        }
        
        // Update drifting
        this.updateDrifting(delta);
    }
    
    // Update drifting state
    updateDrifting(delta) {
        if (this.isDrifting) {
            // Visual feedback - tilt and hop
            const tiltAngle = this.driftDirection * 0.3;
            this.kartGroup.rotation.z = THREE.MathUtils.lerp(this.kartGroup.rotation.z, tiltAngle, 0.1);
            
            // Activate drift particles
            this.driftParticles.active = true;
            
            // Color feedback (sparks) based on driftPower
            if (this.driftPower > 2.5) {
                this.driftSparkColor = 0xff00ff; // Purple
            } else if (this.driftPower > 1.5) {
                this.driftSparkColor = 0xffa500; // Orange
            } else if (this.driftPower > 0.6) {
                this.driftSparkColor = 0x0000ff; // Blue
            } else {
                this.driftSparkColor = 0xffffff; // Neutral
            }
        } else {
            // Reset tilt
            this.kartGroup.rotation.z = THREE.MathUtils.lerp(this.kartGroup.rotation.z, 0, 0.15);
            
            // Deactivate drift particles
            this.driftParticles.active = false;
        }
    }
    
    // Start drifting
    startDrift() {
        if (Math.abs(this.speed) > 10 && !this.isDrifting) {
            this.isDrifting = true;
            this.driftPower = 0;
            
            // Hop at start of drift
            this.velocity.y = 5.0; 
            
            // Determine drift direction based on current steering
            if (this.controls.left) this.driftDirection = -1;
            else if (this.controls.right) this.driftDirection = 1;
            else this.driftDirection = 0;
        }
    }
    
    // End drifting and apply boost if applicable
    endDrift() {
        if (this.isDrifting) {
            this.isDrifting = false;
            
            // Tiered Boosts (Mini-Turbo)
            if (this.driftPower > 2.5) {
                // Purple Boost (Super Ultra Mini-Turbo)
                this.speed += 25;
                this.driftBoost = 2.5;
                console.log("PURPLE BOOST!");
            } else if (this.driftPower > 1.5) {
                // Orange Boost (Super Mini-Turbo)
                this.speed += 18;
                this.driftBoost = 1.5;
                console.log("ORANGE BOOST!");
            } else if (this.driftPower > 0.6) {
                // Blue Boost (Mini-Turbo)
                this.speed += 12;
                this.driftBoost = 0.8;
                console.log("BLUE BOOST!");
            }
            
            // Reset drift power
            this.driftPower = 0;
        }
    }
    
    // Apply physics to kart
    applyPhysics(delta) {
        // Convert speed to velocity vector
        this.direction.set(0, 0, -1).applyQuaternion(this.quaternion);
        this.velocity.copy(this.direction).multiplyScalar(this.speed);
        
        // Apply gravity
        this.velocity.y -= 9.8 * delta;
        
        // Apply drift boost
        if (this.driftBoost > 0) {
            this.speed *= 1.05; // Boost effect
            this.driftBoost -= delta;
            this.driftBoost = Math.max(0, this.driftBoost);
        }
        
        // Update position based on velocity
        this.position.add(this.velocity.clone().multiplyScalar(delta));
        
        // Simple ground collision
        if (this.position.y < 1) {
            this.position.y = 1;
            this.velocity.y = 0;
        }
        
        // Track collision (simplified)
        // In a full game, we would use proper collision detection with the track
        if (!this.isOnTrack()) {
            // Slow down when off track
            this.speed *= 0.95;
        }
    }
    
    // Check if kart is on the track
    isOnTrack() {
        // This is a placeholder - in a full game, we would check against the track geometry
        return true;
    }
    
    // Update kart transform (position and rotation)
    updateTransform() {
        // Update quaternion from Euler rotation
        this.quaternion.setFromEuler(this.rotation);
        
        // Update kart model position and rotation
        this.kartGroup.position.copy(this.position);
        this.kartGroup.rotation.y = this.rotation.y;
        
        // Update wheel rotation based on speed
        const wheelRotation = this.speed * 0.1;
        this.wheelFL.rotation.x += wheelRotation;
        this.wheelFR.rotation.x += wheelRotation;
        this.wheelRL.rotation.x += wheelRotation;
        this.wheelRR.rotation.x += wheelRotation;
        
        // Update wheel steering
        if (!this.isDrifting) {
            if (this.controls.left) {
                this.wheelFL.rotation.y = 0.3;
                this.wheelFR.rotation.y = 0.3;
            } else if (this.controls.right) {
                this.wheelFL.rotation.y = -0.3;
                this.wheelFR.rotation.y = -0.3;
            } else {
                this.wheelFL.rotation.y *= 0.8;
                this.wheelFR.rotation.y *= 0.8;
            }
        } else {
            // When drifting, wheels turn more dramatically
            this.wheelFL.rotation.y = this.driftDirection * 0.5;
            this.wheelFR.rotation.y = this.driftDirection * 0.5;
        }
    }
    
    // Check for checkpoints and lap completion
    checkCheckpoints() {
        // This is a placeholder - in a full game, we would check against actual checkpoints
        // For now, just simulate lap completion for demonstration
        if (Math.random() < 0.0005 && !this.isAI) {
            this.lap++;
            if (this.lap > 3) {
                this.finished = true;
            }
        }
    }
    
    // Update particles
    updateParticles(delta) {
        // Update exhaust particles
        this.exhaustParticles.active = this.speed > 5;
        if (this.exhaustParticles.active) {
            this.exhaustParticles.update(delta);
        }
        
        // Update drift particles
        if (this.driftParticles.active) {
            this.driftParticles.update(delta);
        }
    }
    
    // Get item from item box
    getRandomItem() {
        const items = ['mushroom', 'star', 'shell', 'banana'];
        this.currentItem = items[Math.floor(Math.random() * items.length)];
        return this.currentItem;
    }
    
    // Use current item
    useItem() {
        if (!this.currentItem || this.itemCooldown > 0) return;
        
        switch (this.currentItem) {
            case 'mushroom':
                // Boost
                this.speed += 20;
                break;
                
            case 'star':
                // Invincibility and speed boost
                this.speed += 15;
                // In a full game, we would set an invincibility flag and duration
                break;
                
            case 'shell':
                // Fire a shell forward
                this.fireShell();
                break;
                
            case 'banana':
                // Drop a banana behind
                this.dropBanana();
                break;
        }
        
        // Clear item and set cooldown
        this.currentItem = null;
        this.itemCooldown = 1.0; // 1 second cooldown
    }
    
    // Fire a shell
    fireShell() {
        // This is a placeholder - in a full game, we would create a shell projectile
        console.log("Shell fired!");
    }
    
    // Drop a banana
    dropBanana() {
        // This is a placeholder - in a full game, we would create a banana obstacle
        console.log("Banana dropped!");
    }
    
    // Get kart position
    getPosition() {
        return this.position.clone();
    }
    
    // Get kart rotation
    getRotation() {
        return this.rotation.clone();
    }
    
    // Get kart speed
    getSpeed() {
        return Math.abs(this.speed);
    }
}
