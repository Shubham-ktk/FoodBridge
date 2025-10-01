import * as THREE from 'three';

export type Gate = {
  wall: THREE.Mesh;
  triggerBox: THREE.Box3;
  locked: boolean;
  questionId: string;
  nextLevelLabel?: string;
};

export function createJungleScene(scene: THREE.Scene): { player: THREE.Mesh; gates: Gate[] } {
  const objects: THREE.Object3D[] = [];

  const groundGeo = new THREE.PlaneGeometry(200, 200);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Simple jungle elements: trees and rocks
  const trees = new THREE.Group();
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x14532d });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 });
  for (let i = 0; i < 60; i++) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 2, 8), trunkMat);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), treeMat);
    const tree = new THREE.Group();
    trunk.position.y = 1;
    crown.position.y = 2.2;
    tree.add(trunk);
    tree.add(crown);
    const angle = Math.random() * Math.PI * 2;
    const radius = 20 + Math.random() * 70;
    tree.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    tree.rotation.y = Math.random() * Math.PI;
    tree.scale.setScalar(0.8 + Math.random() * 1.5);
    tree.castShadow = true;
    trees.add(tree);
  }
  scene.add(trees);

  const rocks = new THREE.Group();
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x6b7280 });
  for (let i = 0; i < 25; i++) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6 + Math.random() * 1.2), rockMat);
    rock.position.set((Math.random() - 0.5) * 60, 0.3, (Math.random() - 0.5) * 60);
    rock.castShadow = true;
    rocks.add(rock);
  }
  scene.add(rocks);

  // River strip
  const river = new THREE.Mesh(new THREE.PlaneGeometry(120, 6), new THREE.MeshStandardMaterial({ color: 0x60a5fa, metalness: 0.1, roughness: 0.8 }));
  river.rotation.x = -Math.PI / 2;
  river.position.z = -12;
  river.receiveShadow = true;
  scene.add(river);

  // Player: simple capsule-like
  const player = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.5, 1.0, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0xffc857 })
  );
  player.position.set(0, 1, 0);
  player.castShadow = true;
  scene.add(player);

  // Path and gates
  const path = new THREE.Mesh(new THREE.PlaneGeometry(100, 6), new THREE.MeshStandardMaterial({ color: 0x8b5a2b }));
  path.rotation.x = -Math.PI / 2;
  path.position.z = 0;
  path.receiveShadow = true;
  scene.add(path);

  const gates: Gate[] = [];
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46 });
  function makeGate(x: number, questionId: string, label: string): Gate {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3, 6), wallMat);
    wall.position.set(x, 1.5, 0);
    wall.castShadow = true;
    scene.add(wall);
    const trigger = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(x - 3, 1, 0), new THREE.Vector3(3, 2, 8));
    return { wall, triggerBox: trigger, locked: true, questionId, nextLevelLabel: label };
  }

  gates.push(
    makeGate(12, 'math_1', 'Level 2: Fallen Bridge'),
    makeGate(28, 'science_1', 'Level 3: Ancient Ruins'),
    makeGate(46, 'logic_1', 'Level 4: Hidden Waterfall')
  );

  return { player, gates };
}

