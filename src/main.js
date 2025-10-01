(() => {
  // Configuration
  const MOVEMENT_SPEED = 6;
  const TURN_SPEED = 6; // radians per second toward movement direction
  const PLAYER_HEIGHT = 1.6;
  const PLAYER_RADIUS = 0.35;
  const WORLD_SIZE = 80; // half-extent of square jungle
  const NUM_TREES = 120;
  const NUM_CHESTS = 6;
  const QUESTIONS_PER_LEVEL = 3;

  // DOM elements
  const scoreEl = document.getElementById("scoreValue");
  const levelEl = document.getElementById("levelValue");
  const interactPromptEl = document.getElementById("interactPrompt");
  const questionModalEl = document.getElementById("questionModal");
  const questionTextEl = document.getElementById("questionText");
  const answerFormEl = document.getElementById("answerForm");
  const feedbackEl = document.getElementById("feedback");
  const submitAnswerBtn = document.getElementById("submitAnswer");
  const closeModalBtn = document.getElementById("closeModal");

  // Three.js essentials
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x6fbf73);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 3, 6);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Lighting
  const hemi = new THREE.HemisphereLight(0xdfffe0, 0x114422, 0.4);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(10, 20, 10);
  dir.castShadow = false;
  scene.add(dir);

  // Ground
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(WORLD_SIZE, 64),
    new THREE.MeshLambertMaterial({ color: 0x2f6f2f })
  );
  ground.receiveShadow = false;
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Jungle ambience: fog
  scene.fog = new THREE.FogExp2(0x6fbf73, 0.015);

  // Helper function: random in annulus to keep center clearer
  function randomPositionInJungle(minRadius = 6, maxRadius = WORLD_SIZE - 4) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * (maxRadius - minRadius) + minRadius;
    return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  }

  // Trees
  const treeGroup = new THREE.Group();
  for (let i = 0; i < NUM_TREES; i++) {
    const pos = randomPositionInJungle(4, WORLD_SIZE - 2);
    const trunkHeight = 0.8 + Math.random() * 0.8;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.25, trunkHeight, 6),
      new THREE.MeshStandardMaterial({ color: 0x6b4423 })
    );
    trunk.position.copy(pos);
    trunk.position.y = trunkHeight / 2;

    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(0.9 + Math.random() * 0.7, 1.2 + Math.random() * 0.9, 8),
      new THREE.MeshStandardMaterial({ color: 0x1f8f3a })
    );
    canopy.position.copy(pos);
    canopy.position.y = trunkHeight + 0.9;

    treeGroup.add(trunk, canopy);
  }
  scene.add(treeGroup);

  // Barriers for level gates
  const barriers = [];
  function createBarrierArc(radius, count, y = 0.6) {
    const group = new THREE.Group();
    for (let i = 0; i < count; i++) {
      const t = (i / (count - 1)) * Math.PI * 0.8 - Math.PI * 0.4;
      const x = Math.cos(t) * radius;
      const z = Math.sin(t) * radius;
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.7 + Math.random() * 0.25),
        new THREE.MeshStandardMaterial({ color: 0x444b4a })
      );
      rock.position.set(x, y, z);
      group.add(rock);
    }
    scene.add(group);
    return group;
  }
  const gate1 = createBarrierArc(10, 14);
  barriers.push(gate1);

  // Player (capsule-ish)
  const playerGroup = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(PLAYER_RADIUS, PLAYER_HEIGHT - PLAYER_RADIUS * 2, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0xffe08a, metalness: 0.1, roughness: 0.8 })
  );
  body.position.y = PLAYER_HEIGHT / 2;
  playerGroup.add(body);
  scene.add(playerGroup);

  const cameraOffset = new THREE.Vector3(0, 2.0, 4.5);

  // Input
  const keys = { w: false, a: false, s: false, d: false, e: false };
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (k in keys) keys[k] = true;
  });
  window.addEventListener("keyup", (e) => {
    const k = e.key.toLowerCase();
    if (k in keys) keys[k] = false;
  });

  // Mouse look (pointer lock)
  let yaw = 0;
  let pitch = 0;
  const pitchClamp = { min: -Math.PI / 4, max: Math.PI / 4 };
  renderer.domElement.addEventListener("click", () => {
    if (document.pointerLockElement !== renderer.domElement) {
      renderer.domElement.requestPointerLock();
    }
  });
  document.addEventListener("pointerlockchange", () => {
    // no-op
  });
  document.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement === renderer.domElement) {
      const sensitivity = 0.0025;
      yaw -= e.movementX * sensitivity;
      pitch -= e.movementY * sensitivity;
      pitch = Math.max(pitchClamp.min, Math.min(pitchClamp.max, pitch));
    }
  });

  // Chests
  const chests = [];
  function createChest(position, id) {
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.5, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x8b5a2b })
    );
    base.position.copy(position);
    base.position.y = 0.25;

    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.2, 0.6),
      new THREE.MeshStandardMaterial({ color: 0xd4af37 })
    );
    lid.position.set(position.x, 0.55, position.z);
    lid.userData.hinge = new THREE.Object3D();
    lid.userData.hinge.position.set(position.x - 0.45, 0.55, position.z);
    scene.add(lid.userData.hinge);
    lid.userData.hinge.add(lid);
    lid.position.x = 0.45; // relative to hinge

    const chest = { id, base, lid, opened: false, solved: false };
    chests.push(chest);
    scene.add(base);
    return chest;
  }

  function scatterChests(count) {
    for (let i = 0; i < count; i++) {
      const pos = randomPositionInJungle(4, WORLD_SIZE - 6);
      createChest(pos, i);
    }
  }
  scatterChests(NUM_CHESTS);

  // Questions
  const allQuestions = Array.isArray(window.QUESTIONS) ? window.QUESTIONS.slice() : [];
  const chestIdToQuestionIndex = new Map();
  for (let i = 0; i < chests.length; i++) {
    const qi = i % allQuestions.length;
    chestIdToQuestionIndex.set(chests[i].id, qi);
  }

  // Game state
  let score = 0;
  let level = 1;
  let activeChest = null;
  let questionOpen = false;

  function updateHUD() {
    scoreEl.textContent = String(score);
    levelEl.textContent = String(level);
  }
  updateHUD();

  function openQuestionForChest(chest) {
    const qi = chestIdToQuestionIndex.get(chest.id) ?? 0;
    const q = allQuestions[qi];
    if (!q) return;
    questionOpen = true;
    questionTextEl.textContent = q.prompt;
    answerFormEl.innerHTML = "";
    feedbackEl.textContent = "";
    feedbackEl.className = "feedback";
    q.choices.forEach((choice, idx) => {
      const label = document.createElement("label");
      label.className = "choice";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "answer";
      input.value = String(idx);
      const span = document.createElement("span");
      span.textContent = choice;
      label.appendChild(input);
      label.appendChild(span);
      answerFormEl.appendChild(label);
    });
    questionModalEl.classList.remove("hidden");
  }

  function closeQuestionModal() {
    questionOpen = false;
    questionModalEl.classList.add("hidden");
  }

  submitAnswerBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (!activeChest) return;
    const qi = chestIdToQuestionIndex.get(activeChest.id) ?? 0;
    const q = allQuestions[qi];
    const selected = answerFormEl.querySelector('input[name="answer"]:checked');
    if (!selected) return;
    const isCorrect = Number(selected.value) === q.answerIndex;
    if (isCorrect) {
      feedbackEl.textContent = "Correct!";
      feedbackEl.className = "feedback ok";
      activeChest.solved = true;
      openChest(activeChest);
      score += 1;
      updateHUD();
      maybeAdvanceLevel();
      setTimeout(() => closeQuestionModal(), 650);
    } else {
      feedbackEl.textContent = "Try again.";
      feedbackEl.className = "feedback err";
    }
  });
  closeModalBtn.addEventListener("click", (e) => { e.preventDefault(); closeQuestionModal(); });

  function openChest(chest) {
    if (chest.opened) return;
    chest.opened = true;
    const targetRot = -Math.PI * 0.8;
    const startRot = chest.lid.userData.hinge.rotation.z;
    const start = performance.now();
    const duration = 500;
    function animate() {
      const t = Math.min(1, (performance.now() - start) / duration);
      chest.lid.userData.hinge.rotation.z = startRot + (targetRot - startRot) * t;
      if (t < 1) requestAnimationFrame(animate);
    }
    animate();
    chest.base.material.color.set(0x3cb371);
  }

  function maybeAdvanceLevel() {
    if (level === 1 && score >= QUESTIONS_PER_LEVEL) {
      level = 2;
      updateHUD();
      // Open first gate
      if (barriers[0]) {
        const g = barriers[0];
        const start = performance.now();
        const duration = 900;
        g.children.forEach((mesh, i) => {
          const dir = new THREE.Vector3(mesh.position.x, 0, mesh.position.z).normalize();
          const startPos = mesh.position.clone();
          (function animateRock() {
            const t = Math.min(1, (performance.now() - start) / duration);
            mesh.position.copy(startPos.clone().add(dir.clone().multiplyScalar(t * 3)));
            mesh.position.y = 0.6 + t * 1.0;
            mesh.rotation.x += 0.02;
            mesh.rotation.y += 0.015;
            if (t < 1) requestAnimationFrame(animateRock);
            else mesh.visible = false;
          })();
        });
      }
    }
  }

  // Utility: clamp to world circle
  function clampToWorld(pos) {
    const r = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    if (r > WORLD_SIZE - 1) {
      const n = new THREE.Vector3(pos.x, 0, pos.z).normalize().multiplyScalar(WORLD_SIZE - 1);
      pos.x = n.x; pos.z = n.z;
    }
    pos.y = PLAYER_HEIGHT / 2;
  }

  // Frame loop
  const clock = new THREE.Clock();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const move = new THREE.Vector3();
  function update(delta) {
    // Movement relative to camera yaw
    const camYaw = yaw;
    forward.set(-Math.sin(camYaw), 0, -Math.cos(camYaw));
    right.set(Math.cos(camYaw), 0, -Math.sin(camYaw));
    move.set(0, 0, 0);
    if (keys.w) move.add(forward);
    if (keys.s) move.add(forward.clone().multiplyScalar(-1));
    if (keys.a) move.add(right.clone().multiplyScalar(-1));
    if (keys.d) move.add(right);
    if (move.lengthSq() > 0) move.normalize().multiplyScalar(MOVEMENT_SPEED * delta);

    playerGroup.position.add(move);
    clampToWorld(playerGroup.position);

    // Turn toward movement direction
    if (move.lengthSq() > 0.0001) {
      const targetYaw = Math.atan2(-move.x, -move.z);
      const currentYaw = playerGroup.rotation.y;
      let diff = targetYaw - currentYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const step = Math.sign(diff) * Math.min(Math.abs(diff), TURN_SPEED * delta);
      playerGroup.rotation.y = currentYaw + step;
    }

    // Camera follow
    const camDir = new THREE.Euler(pitch, yaw, 0, "YXZ");
    const behind = cameraOffset.clone().applyEuler(camDir);
    camera.position.copy(playerGroup.position.clone().add(behind));
    camera.lookAt(playerGroup.position.clone().add(new THREE.Vector3(0, 1.0, 0)));

    // Chest proximity
    let near = null;
    let minDist = 9999;
    for (const chest of chests) {
      if (chest.opened) continue;
      const d = chest.base.position.distanceTo(playerGroup.position);
      if (d < 2 && d < minDist) { minDist = d; near = chest; }
    }
    if (!questionOpen && near) {
      interactPromptEl.classList.remove("hidden");
      activeChest = near;
      if (keys.e) {
        openQuestionForChest(near);
      }
    } else {
      interactPromptEl.classList.add("hidden");
      if (!questionOpen) activeChest = null;
    }
  }

  function loop() {
    const delta = Math.min(0.033, clock.getDelta());
    update(delta);
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  loop();

  // Responsiveness
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();

