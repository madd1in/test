// Items class for power-ups and obstacles
class Items {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        
        // Store active items
        this.activeItems = [];
        
        // Load item models
        this.loadItemModels();
    }
    
    // Load item models
    loadItemModels() {
        // Create geometries and materials for items
        this.itemGeometries = {
            mushroom: new THREE.SphereGeometry(0.5, 8, 8),
            star: new THREE.OctahedronGeometry(0.6, 0),
            shell: new THREE.SphereGeometry(0.5, 16, 8),
            banana: new THREE.SphereGeometry(0.4, 8, 8)
        };
        
        this.itemMaterials = {
            mushroom: new THREE.MeshStandardMaterial({
                color: 0xff0000,
                roughness: 0.7,
                metalness: 0.3
            }),
            star: new THREE.MeshStandardMaterial({
                color: 0xffff00,
                emissive: 0xffff00,
                emissiveIntensity: 0.5,
                roughness: 0.3,
                metalness: 0.8
            }),
            shell: new THREE.MeshStandardMaterial({
                color: 0x00ff00,
                roughness: 0.5,
                metalness: 0.5
            }),
            banana: new THREE.MeshStandardMaterial({
                color: 0xffff00,
                roughness: 0.8,
                metalness: 0.2
            })
        };
    }
    
    // Create item box
    createItemBox(position) {
        const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            emissive: 0x333333,
            emissiveIntensity: 0.5
        });
        
        const itemBox = new THREE.Mesh(geometry, material);
        itemBox.position.copy(position);
        itemBox.castShadow = true;
        
        // Add rotation animation
        itemBox.userData = {
            type: 'itemBox',
            rotationSpeed: 0.02,
            active: true
        };
        
        this.scene.add(itemBox);
        this.activeItems.push(itemBox);
        
        return itemBox;
    }
    
    // Create mushroom item
    createMushroom(position) {
        const mushroom = new THREE.Mesh(this.itemGeometries.mushroom, this.itemMaterials.mushroom);
        mushroom.position.copy(position);
        mushroom.castShadow = true;
        
        // Add data
        mushroom.userData = {
            type: 'mushroom',
            effect: 'boost',
            duration: 1.0,
            active: true
        };
        
        this.scene.add(mushroom);
        this.activeItems.push(mushroom);
        
        return mushroom;
    }
    
    // Create star item
    createStar(position) {
        const star = new THREE.Mesh(this.itemGeometries.star, this.itemMaterials.star);
        star.position.copy(position);
        star.castShadow = true;
        
        // Add rotation animation
        star.userData = {
            type: 'star',
            effect: 'invincibility',
            duration: 5.0,
            rotationSpeed: 0.05,
            active: true
        };
        
        this.scene.add(star);
        this.activeItems.push(star);
        
        return star;
    }
    
    // Create shell item
    createShell(position, direction, owner) {
        const shell = new THREE.Mesh(this.itemGeometries.shell, this.itemMaterials.shell);
        shell.position.copy(position);
        shell.castShadow = true;
        
        // Add data and physics
        shell.userData = {
            type: 'shell',
            effect: 'hit',
            velocity: direction.clone().multiplyScalar(30), // Fast moving
            owner: owner,
            lifespan: 5.0, // Seconds before disappearing
            active: true
        };
        
        this.scene.add(shell);
        this.activeItems.push(shell);
        
        return shell;
    }
    
    // Create banana item
    createBanana(position, owner) {
        const banana = new THREE.Mesh(this.itemGeometries.banana, this.itemMaterials.banana);
        banana.position.copy(position);
        banana.castShadow = true;
        
        // Add data
        banana.userData = {
            type: 'banana',
            effect: 'slip',
            owner: owner,
            lifespan: 20.0, // Seconds before disappearing
            active: true
        };
        
        this.scene.add(banana);
        this.activeItems.push(banana);
        
        return banana;
    }
    
    // Update all active items
    update(delta, karts) {
        // Update each item
        for (let i = this.activeItems.length - 1; i >= 0; i--) {
            const item = this.activeItems[i];
            
            // Skip inactive items
            if (!item.userData.active) continue;
            
            // Update based on item type
            switch (item.userData.type) {
                case 'itemBox':
                    // Rotate item box
                    item.rotation.y += item.userData.rotationSpeed;
                    
                    // Check for collision with karts
                    this.checkItemBoxCollision(item, karts);
                    break;
                    
                case 'shell':
                    // Move shell
                    item.position.add(item.userData.velocity.clone().multiplyScalar(delta));
                    item.rotation.z += 0.2;
                    
                    // Check for collision with karts
                    this.checkShellCollision(item, karts);
                    
                    // Update lifespan
                    item.userData.lifespan -= delta;
                    if (item.userData.lifespan <= 0) {
                        this.removeItem(item, i);
                    }
                    break;
                    
                case 'banana':
                    // Check for collision with karts
                    this.checkBananaCollision(item, karts);
                    
                    // Update lifespan
                    item.userData.lifespan -= delta;
                    if (item.userData.lifespan <= 0) {
                        this.removeItem(item, i);
                    }
                    break;
                    
                case 'star':
                    // Rotate star
                    item.rotation.x += item.userData.rotationSpeed;
                    item.rotation.y += item.userData.rotationSpeed;
                    
                    // Update lifespan if it has one
                    if (item.userData.lifespan) {
                        item.userData.lifespan -= delta;
                        if (item.userData.lifespan <= 0) {
                            this.removeItem(item, i);
                        }
                    }
                    break;
                    
                case 'mushroom':
                    // Update lifespan if it has one
                    if (item.userData.lifespan) {
                        item.userData.lifespan -= delta;
                        if (item.userData.lifespan <= 0) {
                            this.removeItem(item, i);
                        }
                    }
                    break;
            }
        }
    }
    
    // Check for collision between item box and karts
    checkItemBoxCollision(itemBox, karts) {
        for (const kart of karts) {
            // Skip if kart already has an item
            if (kart.currentItem) continue;
            
            // Simple distance-based collision detection
            const distance = itemBox.position.distanceTo(kart.getPosition());
            if (distance < 2.5) {
                // Give kart a random item
                kart.getRandomItem();
                
                // Deactivate item box temporarily
                itemBox.userData.active = false;
                itemBox.visible = false;
                
                // Respawn item box after delay
                setTimeout(() => {
                    itemBox.userData.active = true;
                    itemBox.visible = true;
                }, 5000); // 5 seconds
                
                break;
            }
        }
    }
    
    // Check for collision between shell and karts
    checkShellCollision(shell, karts) {
        for (const kart of karts) {
            // Skip if shell belongs to this kart
            if (shell.userData.owner === kart) continue;
            
            // Simple distance-based collision detection
            const distance = shell.position.distanceTo(kart.getPosition());
            if (distance < 2.0) {
                // Hit kart
                this.applyShellEffect(kart);
                
                // Remove shell
                const index = this.activeItems.indexOf(shell);
                if (index !== -1) {
                    this.removeItem(shell, index);
                }
                
                break;
            }
        }
    }
    
    // Check for collision between banana and karts
    checkBananaCollision(banana, karts) {
        for (const kart of karts) {
            // Skip if banana belongs to this kart
            if (banana.userData.owner === kart) continue;
            
            // Simple distance-based collision detection
            const distance = banana.position.distanceTo(kart.getPosition());
            if (distance < 1.5) {
                // Make kart slip
                this.applyBananaEffect(kart);
                
                // Remove banana
                const index = this.activeItems.indexOf(banana);
                if (index !== -1) {
                    this.removeItem(banana, index);
                }
                
                break;
            }
        }
    }
    
    // Apply shell effect to kart
    applyShellEffect(kart) {
        // Slow down kart
        kart.speed *= 0.5;
        
        // In a full game, we would add a spin-out animation
        console.log("Kart hit by shell!");
    }
    
    // Apply banana effect to kart
    applyBananaEffect(kart) {
        // Slow down kart
        kart.speed *= 0.3;
        
        // In a full game, we would add a slip animation
        console.log("Kart slipped on banana!");
    }
    
    // Remove item from scene and active items list
    removeItem(item, index) {
        this.scene.remove(item);
        this.activeItems.splice(index, 1);
    }
}
