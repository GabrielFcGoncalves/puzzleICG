import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export class PhysicsSystem {
    constructor() {
        this.physicsWorld = new CANNON.World();
        this.physicsWorld.gravity.set(0, -9.82, 0); // Standard gravity
        this.physicsWorld.broadphase = new CANNON.NaiveBroadphase();
        this.physicsWorld.solver.iterations = 10;
        
        this.bodies = []; // { mesh, body }
    }

    addBody(mesh, body) {
        this.physicsWorld.addBody(body);
        this.bodies.push({ mesh, body });
    }

    removeBody(body) {
        this.physicsWorld.removeBody(body);
        this.bodies = this.bodies.filter(item => item.body !== body);
    }

    addConstraint(constraint) {
        this.physicsWorld.addConstraint(constraint);
    }

    removeConstraint(constraint) {
        this.physicsWorld.removeConstraint(constraint);
    }

    update(deltaTime) {
        // Step the world
        this.physicsWorld.step(1 / 60, deltaTime, 3);

        // Sync meshes
        this.bodies.forEach(({ mesh, body }) => {
            // Manual copy to be safe
            mesh.position.set(body.position.x, body.position.y, body.position.z);
            mesh.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
        });
    }
}
