// AI controller for computer-controlled karts
class AI {
    constructor(kart, track, player) {
        this.kart = kart;
        this.track = track;
        this.player = player;
        
        // AI settings
        this.pathFollowStrength = 0.8;
        this.avoidanceStrength = 0.5;
        this.itemUseChance = 0.01; // Chance per frame to use an item
        
        // Current target point on track
        this.targetPoint = null;
        this.nextPathIndex = 0;
        
        // Initialize AI
        this.initialize();
    }
    
    // Initialize AI
    initialize() {
        // Set initial target point
        this.updateTargetPoint();
    }
    
    // Update AI behavior
    update(delta) {
        // Update target point if needed
        this.updateTargetPoint();
        
        // Follow racing path
        this.followPath();
        
        // Avoid obstacles and other karts
        this.avoidObstacles();
        
        // Use items occasionally
        this.useItemsStrategically();
    }
    
    // Update target point on track
    updateTargetPoint() {
        // Get current position on track (0 to 1)
        const currentProgress = this.track.getTrackProgress(this.kart.position);
        
        // Calculate next target point (slightly ahead on track)
        const targetProgress = (currentProgress + 0.05) % 1.0;
        this.targetPoint = this.track.trackCurve.getPointAt(targetProgress);
        
        // Add some height to ensure we're targeting above the track
        this.targetPoint.y += 1;
    }
    
    // Follow the racing path
    followPath() {
        if (!this.targetPoint) return;
        
        // Calculate direction to target
        const targetDirection = new THREE.Vector3()
            .subVectors(this.targetPoint, this.kart.position)
            .normalize();
        
        // Calculate angle between kart direction and target direction
        const kartDirection = new THREE.Vector3(0, 0, -1)
            .applyQuaternion(this.kart.quaternion);
        
        const angle = Math.atan2(
            targetDirection.x * kartDirection.z - targetDirection.z * kartDirection.x,
            targetDirection.x * kartDirection.x + targetDirection.z * kartDirection.z
        );
        
        // Apply steering based on angle
        if (angle > 0.1) {
            // Turn left
            this.kart.controls.left = true;
            this.kart.controls.right = false;
        } else if (angle < -0.1) {
            // Turn right
            this.kart.controls.left = false;
            this.kart.controls.right = true;
        } else {
            // Go straight
            this.kart.controls.left = false;
            this.kart.controls.right = false;
        }
        
        // Apply acceleration
        this.kart.controls.forward = true;
        this.kart.controls.backward = false;
        
        // Apply drifting on sharp turns
        if (Math.abs(angle) > 0.5 && this.kart.speed > 20) {
            if (!this.kart.isDrifting) {
                this.kart.startDrift();
            }
        } else if (this.kart.isDrifting) {
            this.kart.endDrift();
        }
    }
    
    // Avoid obstacles and other karts
    avoidObstacles() {
        // This is a simplified implementation
        // In a full game, we would use raycasting to detect obstacles
        
        // Check for nearby karts
        const nearbyKarts = this.findNearbyKarts();
        
        if (nearbyKarts.length > 0) {
            // Simple avoidance - steer away from nearest kart
            const nearestKart = nearbyKarts[0];
            const avoidDirection = new THREE.Vector3()
                .subVectors(this.kart.position, nearestKart.position)
                .normalize();
            
            const kartDirection = new THREE.Vector3(0, 0, -1)
                .applyQuaternion(this.kart.quaternion);
            
            const avoidAngle = Math.atan2(
                avoidDirection.x * kartDirection.z - avoidDirection.z * kartDirection.x,
                avoidDirection.x * kartDirection.x + avoidDirection.z * kartDirection.z
            );
            
            // Override steering if avoidance is needed
            if (avoidAngle > 0) {
                this.kart.controls.left = true;
                this.kart.controls.right = false;
            } else {
                this.kart.controls.left = false;
                this.kart.controls.right = true;
            }
        }
    }
    
    // Find nearby karts
    findNearbyKarts() {
        // This is a simplified implementation
        // In a full game, we would check all karts
        
        const nearbyKarts = [];
        
        // Check distance to player
        const distanceToPlayer = this.kart.position.distanceTo(this.player.position);
        if (distanceToPlayer < 5) {
            nearbyKarts.push(this.player);
        }
        
        return nearbyKarts;
    }
    
    // Use items strategically
    useItemsStrategically() {
        // Only use item if we have one
        if (!this.kart.currentItem) return;
        
        // Random chance to use item
        if (Math.random() < this.itemUseChance) {
            this.kart.useItem();
        }
    }
}
