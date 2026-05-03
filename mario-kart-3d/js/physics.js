// Physics system for the game
class Physics {
    constructor() {
        this.gravity = -9.8;
        this.objects = [];
    }
    
    // Initialize physics
    init(scene) {
        // In a full implementation, we would initialize a proper physics engine
        // For this simplified version, we'll use basic collision detection
        console.log("Physics system initialized");
    }
    
    // Add object to physics system
    addObject(object, options = {}) {
        const physicsObject = {
            object: object,
            mass: options.mass || 1,
            velocity: options.velocity || new THREE.Vector3(),
            angularVelocity: options.angularVelocity || new THREE.Vector3(),
            collider: options.collider || 'box',
            colliderSize: options.colliderSize || new THREE.Vector3(1, 1, 1),
            isStatic: options.isStatic || false
        };
        
        this.objects.push(physicsObject);
        return physicsObject;
    }
    
    // Remove object from physics system
    removeObject(object) {
        const index = this.objects.findIndex(obj => obj.object === object);
        if (index !== -1) {
            this.objects.splice(index, 1);
        }
    }
    
    // Update physics simulation
    update(delta) {
        // Apply gravity and update positions
        for (const obj of this.objects) {
            if (obj.isStatic) continue;
            
            // Apply gravity
            obj.velocity.y += this.gravity * delta;
            
            // Update position
            obj.object.position.x += obj.velocity.x * delta;
            obj.object.position.y += obj.velocity.y * delta;
            obj.object.position.z += obj.velocity.z * delta;
            
            // Update rotation
            obj.object.rotation.x += obj.angularVelocity.x * delta;
            obj.object.rotation.y += obj.angularVelocity.y * delta;
            obj.object.rotation.z += obj.angularVelocity.z * delta;
            
            // Simple ground collision
            if (obj.object.position.y < obj.colliderSize.y / 2) {
                obj.object.position.y = obj.colliderSize.y / 2;
                obj.velocity.y = 0;
            }
        }
        
        // Check for collisions
        this.checkCollisions();
    }
    
    // Check for collisions between objects
    checkCollisions() {
        // This is a simplified collision detection system
        // In a full game, we would use a proper physics engine
        
        for (let i = 0; i < this.objects.length; i++) {
            for (let j = i + 1; j < this.objects.length; j++) {
                const objA = this.objects[i];
                const objB = this.objects[j];
                
                // Skip if either object is static
                if (objA.isStatic && objB.isStatic) continue;
                
                // Simple sphere-sphere collision detection
                const distance = objA.object.position.distanceTo(objB.object.position);
                const minDistance = (objA.colliderSize.x + objB.colliderSize.x) / 2;
                
                if (distance < minDistance) {
                    // Handle collision
                    this.resolveCollision(objA, objB);
                }
            }
        }
    }
    
    // Resolve collision between two objects
    resolveCollision(objA, objB) {
        // Calculate collision normal
        const normal = new THREE.Vector3()
            .subVectors(objB.object.position, objA.object.position)
            .normalize();
        
        // Calculate relative velocity
        const relativeVelocity = new THREE.Vector3()
            .subVectors(objB.velocity, objA.velocity);
        
        // Calculate relative velocity along normal
        const velocityAlongNormal = relativeVelocity.dot(normal);
        
        // Do not resolve if objects are moving away from each other
        if (velocityAlongNormal > 0) return;
        
        // Calculate restitution (bounciness)
        const restitution = 0.2;
        
        // Calculate impulse scalar
        let impulseScalar = -(1 + restitution) * velocityAlongNormal;
        impulseScalar /= 1 / objA.mass + 1 / objB.mass;
        
        // Apply impulse
        const impulse = normal.clone().multiplyScalar(impulseScalar);
        
        if (!objA.isStatic) {
            objA.velocity.sub(impulse.clone().multiplyScalar(1 / objA.mass));
        }
        
        if (!objB.isStatic) {
            objB.velocity.add(impulse.clone().multiplyScalar(1 / objB.mass));
        }
        
        // Separate objects to prevent sticking
        const penetrationDepth = (objA.colliderSize.x + objB.colliderSize.x) / 2 - objA.object.position.distanceTo(objB.object.position);
        const separationVector = normal.clone().multiplyScalar(penetrationDepth * 0.5);
        
        if (!objA.isStatic) {
            objA.object.position.sub(separationVector);
        }
        
        if (!objB.isStatic) {
            objB.object.position.add(separationVector);
        }
    }
}
