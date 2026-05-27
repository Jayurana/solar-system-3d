/* ==========================================================================
   ORION COSMOS - WEBGL OBSERVATORY DECK (THREE.JS)
   ========================================================================== */

let scene, camera, renderer;
let starsGeometry, starsParticles;
let planets = [];
let orbitLines = [];
let eclipticGrid;

// Constellation Mode variables
let constellationLines = [];
let constellationPoints = [];
let skyMapMode = 'orbits'; // 'orbits' or 'constellations'
let warpSpeed = 1.0;

let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

// 1. Initialize WebGL observatory background
function init3D() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // Create Scene & Camera
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030308, 0.007);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 85;

    // Create Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x0e0e26, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffaa44, 4, 400, 0.5);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // Glowing cyan/purple directional lights
    const dLight1 = new THREE.DirectionalLight(0x00f2fe, 1.8);
    dLight1.position.set(-50, 40, 50);
    scene.add(dLight1);

    const dLight2 = new THREE.DirectionalLight(0x9b51e0, 2.2);
    dLight2.position.set(50, -30, 30);
    scene.add(dLight2);

    // Add Ecliptic Reference Grid Helper (Observatory Deck styling)
    eclipticGrid = new THREE.GridHelper(160, 16, 0x00f2fe, 0x121238);
    eclipticGrid.position.y = -10;
    eclipticGrid.material.transparent = true;
    eclipticGrid.material.opacity = 0.15;
    scene.add(eclipticGrid);

    // Create stars and stardust particles
    generateStars();

    // Create constellation visual assets
    buildConstellations();

    // Create Solar Orbits planets
    buildPlanets();

    // Set initial mode
    updateSkyMode(skyMapMode);

    // Bind event controllers
    document.addEventListener('mousemove', onDocumentMouseMove);
    window.addEventListener('resize', onWindowResize);

    // Start rendering loops
    animate();
}

function generateStars() {
    const starsCount = 3000;
    starsGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starsCount * 3);
    const colors = new Float32Array(starsCount * 3);

    const colorOptions = [
        new THREE.Color(0xffffff), // White
        new THREE.Color(0x00f2fe), // Glowing cyan
        new THREE.Color(0x9b51e0), // Stellar purple
        new THREE.Color(0xffa834)  // Amber flare
    ];

    for (let i = 0; i < starsCount * 3; i += 3) {
        // Distribute within a huge shell (leaving center dashboard clean)
        const radius = Math.random() * 450 + 60;
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2 * Math.PI;
        const phi = Math.acos(2 * v - 1);

        positions[i] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i + 2] = radius * Math.cos(phi);

        const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pTexture = createPointTexture();
    const starsMaterial = new THREE.PointsMaterial({
        size: 1.6,
        map: pTexture,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    starsParticles = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starsParticles);
}

function createPointTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.2, 'rgba(0, 242, 254, 0.7)');
    grad.addColorStop(0.5, 'rgba(155, 81, 224, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// Draw custom glowing vector constellations (Orion, Ursa Major)
function buildConstellations() {
    // Orion coordinates (mapped inside 3D space)
    const orionStars = [
        { name: 'Betelgeuse', pos: new THREE.Vector3(-15, 20, -50) },
        { name: 'Bellatrix', pos: new THREE.Vector3(15, 18, -48) },
        { name: 'Alnilam', pos: new THREE.Vector3(0, 0, -45) },     // Belt Center
        { name: 'Alnitak', pos: new THREE.Vector3(-5, 1, -44) },    // Belt Left
        { name: 'Mintaka', pos: new THREE.Vector3(5, -1, -46) },    // Belt Right
        { name: 'Saiph', pos: new THREE.Vector3(-12, -22, -48) },
        { name: 'Rigel', pos: new THREE.Vector3(14, -24, -52) }
    ];

    // Ursa Major coordinates
    const ursaStars = [
        { name: 'Dubhe', pos: new THREE.Vector3(-30, 25, 40) },
        { name: 'Merak', pos: new THREE.Vector3(-32, 12, 42) },
        { name: 'Phecda', pos: new THREE.Vector3(-18, 8, 44) },
        { name: 'Megrez', pos: new THREE.Vector3(-15, 20, 46) },
        { name: 'Alioth', pos: new THREE.Vector3(-2, 16, 48) },
        { name: 'Mizar', pos: new THREE.Vector3(10, 12, 50) },
        { name: 'Alkaid', pos: new THREE.Vector3(22, 6, 52) }
    ];

    // Helper to generate constellation lines
    const lineMat = new THREE.LineBasicMaterial({
        color: 0x00f2fe,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
    });

    const starGeom = new THREE.SphereGeometry(1.2, 16, 16);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Draw Orion lines
    const orionPairs = [
        [0, 1], [0, 3], [1, 4], // Shoulders to Belt
        [3, 2], [2, 4],         // Belt connection
        [3, 5], [4, 6],         // Belt to Legs
        [5, 6]                  // Bottom line
    ];

    orionPairs.forEach(pair => {
        const points = [orionStars[pair[0]].pos, orionStars[pair[1]].pos];
        const geom = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geom, lineMat);
        scene.add(line);
        constellationLines.push(line);
    });

    // Draw Ursa Major (Big Dipper) lines
    const ursaPairs = [
        [0, 1], [1, 2], [2, 3], [3, 0], // Bowl
        [3, 4], [4, 5], [5, 6]          // Handle
    ];

    ursaPairs.forEach(pair => {
        const points = [ursaStars[pair[0]].pos, ursaStars[pair[1]].pos];
        const geom = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geom, lineMat);
        scene.add(line);
        constellationLines.push(line);
    });

    // Generate glowing points for each star
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0x00f2fe,
        transparent: true,
        opacity: 0.8
    });

    [...orionStars, ...ursaStars].forEach(star => {
        const mesh = new THREE.Mesh(starGeom, glowMat);
        mesh.position.copy(star.pos);
        scene.add(mesh);
        constellationPoints.push(mesh);
    });
}

function buildPlanets() {
    // Large illuminated planet (Right background focal point)
    const giantGeometry = new THREE.SphereGeometry(16, 64, 64);
    const giantMaterial = new THREE.MeshStandardMaterial({
        color: 0x071536,
        roughness: 0.8,
        metalness: 0.2,
        emissive: 0x0a0920,
        bumpScale: 0.1
    });
    const giantPlanet = new THREE.Mesh(giantGeometry, giantMaterial);
    giantPlanet.position.set(45, -5, -20);
    scene.add(giantPlanet);
    planets.push({ mesh: giantPlanet, rotationSpeed: 0.001, orbitSpeed: 0, distance: 0 });

    // Active planets
    const planetConfigs = [
        { radius: 2.8, distance: 34, color: 0x00f2fe, emissive: 0x002c40, orbitSpeed: 0.006, rotationSpeed: 0.015, inclination: 0.2 },
        { radius: 4.5, distance: 58, color: 0x9b51e0, emissive: 0x24043a, orbitSpeed: 0.003, rotationSpeed: 0.008, inclination: -0.15, hasRings: true },
        { radius: 2.0, distance: 78, color: 0xff9f43, emissive: 0x3d1700, orbitSpeed: 0.0015, rotationSpeed: 0.02, inclination: 0.3 }
    ];

    planetConfigs.forEach(config => {
        const geometry = new THREE.SphereGeometry(config.radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: config.color,
            roughness: 0.5,
            metalness: 0.3,
            emissive: config.emissive
        });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        if (config.hasRings) {
            const ringGeom = new THREE.RingGeometry(config.radius * 1.5, config.radius * 2.5, 32);
            const ringMat = new THREE.MeshStandardMaterial({
                color: 0x9b51e0,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.4
            });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.rotation.x = Math.PI / 2.2;
            mesh.add(ring);
        }

        planets.push({
            mesh: mesh,
            distance: config.distance,
            orbitSpeed: config.orbitSpeed,
            rotationSpeed: config.rotationSpeed,
            angle: Math.random() * Math.PI * 2,
            inclination: config.inclination
        });

        // Glowing orbit paths
        const points = [];
        for (let i = 0; i <= 64; i++) {
            const theta = (i / 64) * Math.PI * 2;
            const x = Math.cos(theta) * config.distance;
            const z = Math.sin(theta) * config.distance;
            const y = Math.sin(theta) * config.distance * config.inclination;
            points.push(new THREE.Vector3(x, y, z));
        }

        const orbitGeom = new THREE.BufferGeometry().setFromPoints(points);
        const orbitMat = new THREE.LineBasicMaterial({
            color: config.color,
            transparent: true,
            opacity: 0.08
        });
        const orbitLine = new THREE.Line(orbitGeom, orbitMat);
        scene.add(orbitLine);
        orbitLines.push(orbitLine);
    });
}

function updateSkyMode(mode) {
    skyMapMode = mode;

    if (mode === 'orbits') {
        // Show planets, orbital lines, and cosmic grid
        planets.forEach(p => p.mesh.visible = true);
        orbitLines.forEach(l => l.visible = true);
        if (eclipticGrid) eclipticGrid.visible = true;

        // Hide constellation lines and vector stars
        constellationLines.forEach(l => l.visible = false);
        constellationPoints.forEach(p => p.visible = false);
    } else {
        // Hide orbits and planets
        planets.forEach(p => p.mesh.visible = false);
        orbitLines.forEach(l => l.visible = false);
        if (eclipticGrid) eclipticGrid.visible = false;

        // Show constellation vector lines and stars
        constellationLines.forEach(l => l.visible = true);
        constellationPoints.forEach(p => p.visible = true);
    }
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) / 100;
    mouseY = (event.clientY - windowHalfY) / 100;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.001;

    // Smooth camera drift (parallax)
    targetX = mouseX * 0.4;
    targetY = mouseY * 0.4;

    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (-targetY - camera.position.y) * 0.05;
    
    // Slow camera focal rotation
    camera.position.z = 85 + Math.sin(time * 0.08) * 3;
    camera.lookAt(new THREE.Vector3(8, 0, 0));

    // Slow particles field drift
    if (starsParticles) {
        starsParticles.rotation.y = time * 0.003;
        starsParticles.rotation.x = time * 0.001;
    }

    // Animate constellation points pulsing
    if (skyMapMode === 'constellations') {
        constellationPoints.forEach((p, idx) => {
            p.scale.setScalar(1 + Math.sin(time * 3 + idx) * 0.15);
        });
    }

    // Animate planets (scaled by warp speed slider settings)
    if (skyMapMode === 'orbits') {
        planets.forEach(planet => {
            if (planet.orbitSpeed > 0) {
                planet.angle += planet.orbitSpeed * warpSpeed;
                planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
                planet.mesh.position.z = Math.sin(planet.angle) * planet.distance;
                planet.mesh.position.y = Math.sin(planet.angle) * planet.distance * planet.inclination;
            }
            planet.mesh.rotation.y += planet.rotationSpeed * warpSpeed;
        });
    }

    renderer.render(scene, camera);
}

// Start observatory WebGL view
window.addEventListener('DOMContentLoaded', () => {
    try {
        const testCanvas = document.createElement('canvas');
        const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
        if (gl) {
            init3D();
        }
    } catch (e) {
        console.warn("WebGL blocked or unsupported. Fallback active.");
    }
});

// Expose controls to global window for interface triggers
window.setSkyMode = function(mode) {
    updateSkyMode(mode);
};

window.setWarpSpeed = function(speed) {
    warpSpeed = parseFloat(speed);
};
