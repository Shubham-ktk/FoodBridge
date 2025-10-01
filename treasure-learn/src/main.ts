import * as THREE from 'three';
import { createJungleScene, type Gate } from './game/scene';
import { createKeyboardInput } from './game/input';
import { QuestionManager } from './game/questions';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 6, 10);

const hemi = new THREE.HemisphereLight(0xffffff, 0x335533, 0.8);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(20, 30, 10);
sun.castShadow = true;
scene.add(sun);

const { player, gates } = createJungleScene(scene);

const input = createKeyboardInput();
const questionManager = new QuestionManager(
  document.getElementById('question-overlay') as HTMLDivElement,
  document.getElementById('question-text') as HTMLDivElement,
  document.getElementById('choices') as HTMLDivElement,
  document.getElementById('feedback') as HTMLDivElement
);

const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();
let isQuestionActive = false;

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function updatePlayer(delta: number) {
  const acceleration = 25;
  const damping = 10;

  playerDirection.set(0, 0, 0);
  if (input.forward) playerDirection.z -= 1;
  if (input.backward) playerDirection.z += 1;
  if (input.left) playerDirection.x -= 1;
  if (input.right) playerDirection.x += 1;
  playerDirection.normalize();

  playerVelocity.x += playerDirection.x * acceleration * delta;
  playerVelocity.z += playerDirection.z * acceleration * delta;

  // Apply damping
  playerVelocity.x -= playerVelocity.x * damping * delta;
  playerVelocity.z -= playerVelocity.z * damping * delta;

  // Clamp max speed
  playerVelocity.x = clamp(playerVelocity.x, -12, 12);
  playerVelocity.z = clamp(playerVelocity.z, -12, 12);

  player.position.x += playerVelocity.x * delta;
  player.position.z += playerVelocity.z * delta;

  // Keep player on ground
  player.position.y = 1;
}

function updateCamera() {
  const desiredPosition = new THREE.Vector3(
    player.position.x - 8,
    player.position.y + 6,
    player.position.z + 10
  );
  camera.position.lerp(desiredPosition, 0.08);
  camera.lookAt(player.position);
}

async function checkGates() {
  if (isQuestionActive) return;
  for (const gate of gates) {
    if (gate.locked && gate.triggerBox.containsPoint(player.position)) {
      isQuestionActive = true;
      const correct = await questionManager.ask(gate.questionId);
      if (correct) {
        gate.locked = false;
        gate.wall.visible = false;
        const levelEl = document.getElementById('level-indicator');
        if (levelEl) levelEl.textContent = gate.nextLevelLabel ?? 'Next Area Unlocked';
      }
      isQuestionActive = false;
      break;
    }
  }
}

let prev = performance.now();
function animate(now = performance.now()) {
  requestAnimationFrame(animate);
  const delta = Math.min((now - prev) / 1000, 0.033);
  prev = now;

  if (!isQuestionActive) updatePlayer(delta);
  updateCamera();
  checkGates();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

