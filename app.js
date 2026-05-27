/* ==========================================================================
   ORION COSMOS - OBSERVATORY STATION MAIN PROCESSOR (APP.JS)
   ========================================================================== */

// 1. Starfield Background Particle System (2D Fallback)
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let stars = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
}

function initStars() {
    stars = [];
    const count = Math.floor((canvas.width * canvas.height) / 3200);
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.5 + 0.2,
            brightness: Math.random(),
            twinkleSpeed: Math.random() * 0.02 + 0.005
        });
    }
}

function drawStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(star => {
        star.brightness += star.twinkleSpeed;
        if (star.brightness > 1 || star.brightness < 0) {
            star.twinkleSpeed = -star.twinkleSpeed;
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, star.brightness)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function animateStars() {
    drawStars();
    requestAnimationFrame(animateStars);
}

// 2. Launch Screen Loader Process
const launchScreen = document.getElementById('launch-deck');
const launchLoader = document.getElementById('launch-loader');
const btnEngage = document.getElementById('btn-engage-system');
const launchTerminal = document.getElementById('launch-terminal');

const terminalMessages = [
    "> Loading space-deck assets...",
    "> Fetching NASA-derived orbital constants...",
    "> Establishing radio telemetry link...",
    "> Calibrating WebGL spatial cameras...",
    "> Calibrating 3-Channel synth filters...",
    "> DECK READY. WAITING FOR ENGAGEMENT LOCK."
];

let messageIndex = 0;
function typeLaunchLogs() {
    if (messageIndex < terminalMessages.length) {
        const p = document.createElement('p');
        p.textContent = terminalMessages[messageIndex];
        launchTerminal.appendChild(p);
        launchTerminal.scrollTop = launchTerminal.scrollHeight;
        messageIndex++;
        
        // Progress bar steps
        const progress = (messageIndex / terminalMessages.length) * 100;
        launchLoader.style.width = `${progress}%`;
        
        setTimeout(typeLaunchLogs, 400 + Math.random() * 300);
    } else {
        btnEngage.classList.add('visible');
    }
}

// Trigger initial boot logs
setTimeout(typeLaunchLogs, 800);

// 3. Multi-Channel Web Audio Synthesizer
let audioCtx = null;
let humOsc = null;
let humGain = null;

let windNoise = null;
let windFilter = null;
let windGain = null;

let beepGain = null;
let audioBridgeActive = false;

const audioBridgeBtn = document.getElementById('audio-bridge-toggle');

function initSynthesizer() {
    if (audioCtx) return;
    
    // Initialize audio context
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Channel 1: Warp Hum Synth (Deep base triangle wave with lowpass)
    const lowpass = audioCtx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(100, audioCtx.currentTime);

    humOsc = audioCtx.createOscillator();
    humOsc.type = 'triangle';
    humOsc.frequency.setValueAtTime(55, audioCtx.currentTime); // Low A (55Hz)

    humGain = audioCtx.createGain();
    const initHumVol = parseFloat(document.getElementById('vol-hum').value) / 400; // Scaled
    humGain.gain.setValueAtTime(initHumVol, audioCtx.currentTime);

    humOsc.connect(lowpass);
    lowpass.connect(humGain);
    humGain.connect(audioCtx.destination);
    humOsc.start();

    // Channel 2: Stellar Wind Synth (Programmable white noise filtered with sweep LFO)
    const sampleRate = audioCtx.sampleRate;
    const bufferSize = sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        noiseData[i] = Math.random() * 2 - 1;
    }

    windNoise = audioCtx.createBufferSource();
    windNoise.buffer = noiseBuffer;
    windNoise.loop = true;

    windFilter = audioCtx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(350, audioCtx.currentTime);
    windFilter.Q.setValueAtTime(3.0, audioCtx.currentTime);

    // Slow sweep LFO for wind frequency movement
    const windLFO = audioCtx.createOscillator();
    windLFO.type = 'sine';
    windLFO.frequency.setValueAtTime(0.08, audioCtx.currentTime); // Sweep every 12 seconds
    const windLFOGain = audioCtx.createGain();
    windLFOGain.gain.setValueAtTime(150, audioCtx.currentTime);

    windLFO.connect(windLFOGain);
    windLFOGain.connect(windFilter.frequency);

    windGain = audioCtx.createGain();
    const initWindVol = parseFloat(document.getElementById('vol-wind').value) / 600; // Scaled
    windGain.gain.setValueAtTime(initWindVol, audioCtx.currentTime);

    windNoise.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(audioCtx.destination);
    windLFO.start();
    windNoise.start();

    // Channel 3: Telemetry Feedback Click synth (gain controls click beeps)
    beepGain = audioCtx.createGain();
    const initBeepsVol = parseFloat(document.getElementById('vol-beeps').value) / 100;
    beepGain.gain.setValueAtTime(initBeepsVol, audioCtx.currentTime);
    beepGain.connect(audioCtx.destination);
    
    audioBridgeActive = true;
    audioBridgeBtn.classList.add('accent-text');
    audioBridgeBtn.innerHTML = '<i class="fa-solid fa-tower-broadcast"></i>';
    writeConsoleLog("> Telemetry audio stream established.");
}

function stopSynthesizer() {
    if (humOsc) {
        humOsc.stop();
        humOsc.disconnect();
        humOsc = null;
    }
    if (windNoise) {
        windNoise.stop();
        windNoise.disconnect();
        windNoise = null;
    }
    audioBridgeActive = false;
    audioBridgeBtn.classList.remove('accent-text');
    audioBridgeBtn.innerHTML = '<i class="fa-solid fa-volume-mute"></i>';
    writeConsoleLog("> Audio bridge feed terminated.");
}

function playBeep(freq, duration = 0.12) {
    if (!audioBridgeActive || !audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const localGain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    // Short pitch slide decay
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + duration);

    localGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    localGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(localGain);
    localGain.connect(beepGain);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// Engage Deck Button Handler
btnEngage.addEventListener('click', () => {
    initSynthesizer();
    playBeep(880, 0.25);
    
    // Transition overlay away
    launchScreen.classList.add('fade-out');
    setTimeout(() => {
        launchScreen.style.display = 'none';
    }, 850);
});

// Sound Board Settings Control
document.getElementById('vol-hum').addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value) / 400;
    if (humGain && audioCtx) {
        humGain.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.05);
    }
    document.getElementById('hum-hz').textContent = `${Math.floor(55 + (vol * 50))} HZ`;
});

document.getElementById('vol-wind').addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value) / 600;
    if (windGain && audioCtx) {
        windGain.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.05);
    }
});

document.getElementById('vol-beeps').addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value) / 100;
    if (beepGain && audioCtx) {
        beepGain.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.05);
    }
});

audioBridgeBtn.addEventListener('click', () => {
    if (audioBridgeActive) {
        stopSynthesizer();
    } else {
        initSynthesizer();
    }
});

// Connect sound clicks to all UI elements
document.querySelectorAll('a, button, input[type="range"]').forEach(el => {
    el.addEventListener('mouseenter', () => {
        playBeep(980, 0.03);
    });
    el.addEventListener('click', () => {
        playBeep(640, 0.08);
    });
});

// 4. Cockpit Panel Settings & Diagnostic Logs
const diagnosticLogsBox = document.getElementById('deck-terminal-logs');

function writeConsoleLog(text) {
    const p = document.createElement('p');
    p.className = 'log-info';
    p.textContent = text;
    diagnosticLogsBox.appendChild(p);
    diagnosticLogsBox.scrollTop = diagnosticLogsBox.scrollHeight;
}

// Mode switches
document.getElementById('btn-mode-orbits').addEventListener('click', (e) => {
    document.getElementById('btn-mode-orbits').classList.add('active');
    document.getElementById('btn-mode-constellations').classList.remove('active');
    if (window.setSkyMode) window.setSkyMode('orbits');
    writeConsoleLog("> Mode switched: Ecliptic Orbits Render active.");
});

document.getElementById('btn-mode-constellations').addEventListener('click', (e) => {
    document.getElementById('btn-mode-constellations').classList.add('active');
    document.getElementById('btn-mode-orbits').classList.remove('active');
    if (window.setSkyMode) window.setSkyMode('constellations');
    writeConsoleLog("> Mode switched: Stellar Constellations Line Mesh active.");
});

// Warp Speed settings
const warpSlider = document.getElementById('warp-speed-slider');
warpSlider.addEventListener('input', (e) => {
    const warp = e.target.value;
    if (window.setWarpSpeed) window.setWarpSpeed(warp);
    writeConsoleLog(`> Simulation speed updated to ${warp}x velocity.`);
});

// 5. Header Scroll Effect & Navigation Link Active States
const header = document.querySelector('.main-header');
const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
const sections = document.querySelectorAll('section');

window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
        header.style.background = 'rgba(3, 3, 8, 0.96)';
        header.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.6)';
    } else {
        header.style.background = 'rgba(3, 3, 8, 0.75)';
        header.style.boxShadow = 'none';
    }

    let activeSec = '';
    sections.forEach(sec => {
        const secTop = sec.offsetTop - 150;
        if (window.scrollY >= secTop) {
            activeSec = sec.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${activeSec}`) {
            link.classList.add('active');
        }
    });
});

// Mobile Navigation menu drawer
const mobileToggle = document.querySelector('.mobile-nav-toggle');
const mobileDrawer = document.querySelector('.mobile-drawer');
const mobileClose = document.querySelector('.mobile-drawer-close');

mobileToggle.addEventListener('click', () => {
    mobileDrawer.classList.add('open');
});
mobileClose.addEventListener('click', () => {
    mobileDrawer.classList.remove('open');
});
document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
    });
});

// Simulator fullscreen controller
const btnFullscreen = document.getElementById('btn-fullscreen');
const iframeContainer = document.getElementById('iframe-container');

btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        iframeContainer.requestFullscreen().catch(err => {
            alert(`Error launching fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
});

// 6. Advanced Planet database (Core, Atmosphere, Escape, Orbits)
const celestialData = [
    {
        id: "sun",
        name: "The Sun",
        type: "star",
        class: "sphere-sun",
        tagline: "Heart of the Solar System",
        overview: "The Sun is a yellow dwarf star at the center of our solar system. Its intense gravity holds the entire system together, keeping planets, asteroids, and comets in orbit.",
        structure: "Composed mostly of hydrogen and helium, the Sun's core produces energy through nuclear fusion. Above the core lie the radiative and convective zones, capped by the visible photosphere, chromosphere, and corona.",
        funFact: "Contains 99.86% of the mass of the entire Solar System.",
        diameter: "1,392,700 km",
        distance: "0 km",
        orbit: "230M Earth Years",
        temp: "5,500°C",
        moons: "0",
        gravity: "27.9g",
        escapeVelocity: "615.0 km/s",
        atmosphere: "Hydrogen (73%), Helium (25%)",
        core: "Hot, dense nuclear fusion reactor core",
        stats: { mass: 100, radius: 100, moons: 0 },
        image: "https://upload.wikimedia.org/wikipedia/commons/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg",
        orbitalVelocity: "220.0 km/s",
        classBadge: "STAR CLASS"
    },
    {
        id: "mercury",
        name: "Mercury",
        type: "terrestrial",
        class: "sphere-mercury",
        tagline: "The Swift Planet",
        overview: "The smallest planet in our solar system, closest to the Sun. It experiences extreme temperature swings due to its lack of a protective atmosphere.",
        structure: "Mercury is comprised of a massive metallic core (85% of planet radius) covered by a rocky silicate crust. It is solid, heavily cratered, and volcanically dead.",
        funFact: "A single year on Mercury lasts only 88 Earth days.",
        diameter: "4,879 km",
        distance: "57,909,050 km",
        orbit: "88 Earth Days",
        temp: "-180°C to 430°C",
        moons: "0",
        gravity: "0.38g",
        escapeVelocity: "4.3 km/s",
        atmosphere: "Oxygen, Sodium, Hydrogen (Exosphere)",
        core: "Molten liquid iron-nickel core",
        stats: { mass: 0.055, radius: 3.8, moons: 0 },
        image: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Mercury_in_true_color.jpg",
        orbitalVelocity: "47.4 km/s",
        classBadge: "TERRESTRIAL CLASS"
    },
    {
        id: "venus",
        name: "Venus",
        type: "terrestrial",
        class: "sphere-venus",
        tagline: "Greenhouse Furnace",
        overview: "Venus is our closest planetary neighbor. Its dense atmosphere traps solar heat in a runaway greenhouse effect, making it the hottest planet in the solar system.",
        structure: "An iron-nickel core wrapped in a silicate mantle and thin basalt crust. Its surface features sweeping volcanic plains and ancient lava tubes.",
        funFact: "Venus spins backward on its axis (retrograde rotation) compared to Earth.",
        diameter: "12,104 km",
        distance: "108,208,000 km",
        orbit: "225 Earth Days",
        temp: "465°C",
        moons: "0",
        gravity: "0.90g",
        escapeVelocity: "10.36 km/s",
        atmosphere: "Carbon Dioxide (96.5%), Nitrogen (3.5%)",
        core: "Solid metallic core with convective fluid mantle",
        stats: { mass: 0.815, radius: 9.5, moons: 0 },
        image: "https://upload.wikimedia.org/wikipedia/commons/e/e5/Venus-real_color.jpg",
        orbitalVelocity: "35.0 km/s",
        classBadge: "TERRESTRIAL CLASS"
    },
    {
        id: "earth",
        name: "Earth",
        type: "terrestrial",
        class: "sphere-earth",
        tagline: "The Living Blue World",
        overview: "Our home planet is the only place known to harbor life. It is the largest terrestrial planet, covered with liquid water on 70% of its surface.",
        structure: "Composed of a solid inner core, liquid outer core, convective mantle, and thin tectonic plate crust. Life is supported by plate tectonics and a nitrogen-oxygen atmosphere.",
        funFact: "Our magnetic field is generated by liquid iron movements in the outer core.",
        diameter: "12,742 km",
        distance: "149,598,261 km",
        orbit: "365.25 Days",
        temp: "-89°C to 58°C",
        moons: "1",
        gravity: "1.00g",
        escapeVelocity: "11.18 km/s",
        atmosphere: "Nitrogen (78%), Oxygen (21%), Argon (0.9%)",
        core: "Solid iron-nickel inner core",
        stats: { mass: 1.0, radius: 10, moons: 1 },
        image: "https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg",
        orbitalVelocity: "29.8 km/s",
        classBadge: "TERRESTRIAL CLASS"
    },
    {
        id: "mars",
        name: "Mars",
        type: "terrestrial",
        class: "sphere-mars",
        tagline: "The Red Planet",
        overview: "Mars is a cold desert planet with polar ice caps and a thin carbon dioxide atmosphere. Massive channels suggest ancient rivers once flowed across its surface.",
        structure: "A silicate rock mantle overlaying a solid iron, nickel, and sulfur core. The planet's rusty color is due to iron oxide dust coating the surface.",
        funFact: "Mars is home to Olympus Mons, the largest volcano in the Solar System.",
        diameter: "6,779 km",
        distance: "227,939,100 km",
        orbit: "687 Earth Days",
        temp: "-153°C to 20°C",
        moons: "2",
        gravity: "0.38g",
        escapeVelocity: "5.03 km/s",
        atmosphere: "Carbon Dioxide (95%), Nitrogen (2.6%)",
        core: "Solid iron-sulfur core (non-magnetic)",
        stats: { mass: 0.107, radius: 5.3, moons: 2 },
        image: "https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg",
        orbitalVelocity: "24.1 km/s",
        classBadge: "TERRESTRIAL CLASS"
    },
    {
        id: "jupiter",
        name: "Jupiter",
        type: "gas-giant",
        class: "sphere-jupiter",
        tagline: "The Giant Shield",
        overview: "Jupiter is a gas giant twice as massive as all other solar system planets combined. Its massive gravity attracts and deflects comet impacts.",
        structure: "Jupiter consists mostly of hydrogen and helium gas wrapping an ocean of liquid metallic hydrogen, compressing a dense rock-ice core at the center.",
        funFact: "Its Great Red Spot is a giant spinning storm twice the width of Earth.",
        diameter: "139,820 km",
        distance: "778,547,200 km",
        orbit: "12 Earth Years",
        temp: "-110°C",
        moons: "95",
        gravity: "2.53g",
        escapeVelocity: "59.5 km/s",
        atmosphere: "Hydrogen (89.8%), Helium (10.2%)",
        core: "Dense rock, metal, and exotic high-pressure ice core",
        stats: { mass: 31.78, radius: 55, moons: 95 },
        image: "https://upload.wikimedia.org/wikipedia/commons/2/2b/Jupiter_and_its_shrunken_Great_Red_Spot.jpg",
        orbitalVelocity: "13.1 km/s",
        classBadge: "GAS GIANT"
    },
    {
        id: "saturn",
        name: "Saturn",
        type: "gas-giant",
        class: "sphere-saturn",
        tagline: "The Jewel of the System",
        overview: "Adorned with thousands of dazzling rings made of ice, dust, and rock fragments, Saturn is the second-largest gas giant.",
        structure: "Mainly hydrogen and helium gas layer fading into liquid metallic hydrogen. The planetary density is lower than water.",
        funFact: "Saturn possesses 146 moons, including Titan, which holds a dense methane atmosphere.",
        diameter: "116,460 km",
        distance: "1,433,525,000 km",
        orbit: "29 Earth Years",
        temp: "-140°C",
        moons: "146",
        gravity: "1.06g",
        escapeVelocity: "35.5 km/s",
        atmosphere: "Hydrogen (96.3%), Helium (3.2%)",
        core: "Rocky iron-nickel core surrounded by liquid hydrogen",
        stats: { mass: 9.52, radius: 46, moons: 100 },
        image: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg",
        orbitalVelocity: "9.7 km/s",
        classBadge: "GAS GIANT"
    },
    {
        id: "uranus",
        name: "Uranus",
        type: "ice-giant",
        class: "sphere-uranus",
        tagline: "The Sideways Giant",
        overview: "Uranus is an ice giant with a pale cyan atmosphere. It is unique because it rotates nearly completely on its side, rolling around the Sun.",
        structure: "A vast hot ocean of water, ammonia, and methane ice surrounding a rocky core. Its pale cyan color is due to atmospheric methane.",
        funFact: "Uranus experiences extreme seasons where poles face the sun for 21 years.",
        diameter: "50,724 km",
        distance: "2,870,972,000 km",
        orbit: "84 Earth Years",
        temp: "-195°C",
        moons: "28",
        gravity: "0.89g",
        escapeVelocity: "21.3 km/s",
        atmosphere: "Hydrogen (82.5%), Helium (15.2%), Methane (2.3%)",
        core: "Silicate rock and iron-nickel core",
        stats: { mass: 1.45, radius: 19.8, moons: 28 },
        image: "https://upload.wikimedia.org/wikipedia/commons/3/3d/Uranus2.jpg",
        orbitalVelocity: "6.8 km/s",
        classBadge: "ICE GIANT"
    },
    {
        id: "neptune",
        name: "Neptune",
        type: "ice-giant",
        class: "sphere-neptune",
        tagline: "The Supersonic Storm",
        overview: "Neptune is the most distant planet in our system. It is a cold, dark ice giant whipped by supersonic winds reaching 2,100 km/h.",
        structure: "An icy water-ammonia mantle surrounding a rocky core. High-pressure methane creates its deep blue coloring and violent active storm clouds.",
        funFact: "Neptune was located mathematically before ever being observed by telescope.",
        diameter: "49,244 km",
        distance: "4,495,060,000 km",
        orbit: "165 Earth Years",
        temp: "-200°C",
        moons: "16",
        gravity: "1.14g",
        escapeVelocity: "23.5 km/s",
        atmosphere: "Hydrogen (80%), Helium (19%), Methane (1.5%)",
        core: "Iron, nickel, and silicate rock core",
        stats: { mass: 1.71, radius: 19.3, moons: 16 },
        image: "https://upload.wikimedia.org/wikipedia/commons/5/56/Neptune_Full.jpg",
        orbitalVelocity: "5.4 km/s",
        classBadge: "ICE GIANT"
    },
    {
        id: "pluto",
        name: "Pluto",
        type: "dwarf",
        class: "sphere-pluto",
        tagline: "The Ice Outpost",
        overview: "Reclassified as a dwarf planet in 2006, Pluto is a complex world of nitrogen glaciers, water ice mountains, and a thin transient atmosphere.",
        structure: "Pluto has a rocky core surrounded by a massive mantle of water ice. Glaciers of nitrogen and methane coat its crust.",
        funFact: "Its large moon, Charon, is so large they orbit each other like a double planet.",
        diameter: "2,376 km",
        distance: "5,906,380,000 km",
        orbit: "248 Earth Years",
        temp: "-225°C",
        moons: "5",
        gravity: "0.06g",
        escapeVelocity: "1.21 km/s",
        atmosphere: "Nitrogen (99%), Methane, Carbon Monoxide",
        core: "Dense silicate core wrapped in water-ice mantle",
        stats: { mass: 0.002, radius: 1.8, moons: 5 },
        image: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Pluto_in_True_Color_-_High-Res.jpg",
        orbitalVelocity: "4.7 km/s",
        classBadge: "DWARF PLANET"
    }
];

// Generate Planet Cards inside Registry
const planetGrid = document.getElementById('planet-grid');
const searchInput = document.getElementById('planet-search');
const filterBtns = document.querySelectorAll('.filter-btn');

function renderPlanetCards(data) {
    planetGrid.innerHTML = '';
    
    if (data.length === 0) {
        planetGrid.innerHTML = `
            <div class="no-results text-center" style="grid-column: 1/-1; padding: 40px;">
                <i class="fa-solid fa-satellite-dish" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 16px;"></i>
                <p style="color: var(--text-secondary);">No scanning matches detected in this sector.</p>
            </div>
        `;
        return;
    }

    data.forEach(body => {
        // Create wrapper for Danilo Sierra style (so tags sit below the image)
        const wrapper = document.createElement('div');
        wrapper.className = 'planet-card-wrapper';
        wrapper.setAttribute('data-id', body.id);
        
        // Define column grid widths and featured highlights
        if (body.id === 'jupiter' || body.id === 'saturn') {
            wrapper.classList.add('featured-card', 'grid-col-2');
        } else if (body.id === 'earth') {
            wrapper.classList.add('grid-col-2');
        } else {
            wrapper.classList.add('grid-col-1');
        }

        const card = document.createElement('div');
        card.className = 'planet-card';
        card.setAttribute('data-id', body.id);
        
        const isFeatured = body.id === 'jupiter' || body.id === 'saturn';
        const nameClass = isFeatured ? 'planet-title-default featured-title' : 'planet-title-default';

        card.innerHTML = `
            <img class="planet-card-image" src="${body.image}" alt="${body.name}" loading="lazy">
            
            <!-- Blinking status dot in top-right -->
            <div class="status-dot-container">
                ${isFeatured ? `<span class="featured-badge font-mono">FEATURED · SOL SYSTEM</span>` : ''}
                <span class="blinking-dot">●</span>
            </div>
            
            <!-- Default Front Face Overlay -->
            <div class="planet-default-overlay">
                <h3 class="${nameClass}">${body.name}</h3>
                <span class="planet-badge-default">${body.classBadge}</span>
            </div>
            
            <!-- Hover Telemetry Stats Overlay -->
            <div class="planet-hover-overlay">
                <h3 class="planet-title-hover">${body.name}</h3>
                <div class="telemetry-row">
                    <span>DISTANCE FROM SUN</span>
                    <span class="val-cyan">${body.id === 'sun' ? '0 km' : (parseFloat(body.distance.replace(/,/g, '')) / 1000000).toFixed(1) + 'M km'}</span>
                </div>
                <div class="telemetry-row">
                    <span>ORBITAL VELOCITY</span>
                    <span class="val-amber">${body.orbitalVelocity}</span>
                </div>
                <div class="telemetry-row">
                    <span>GRAVITY FACTOR</span>
                    <span class="val-white">${body.gravity}</span>
                </div>
                <a href="#encyclopedia" class="view-telemetry-link">→ View Full Telemetry</a>
            </div>
        `;

        // Interactive beeps for card hover
        card.addEventListener('mouseenter', () => {
            if (typeof playBeep === 'function') {
                playBeep(980, 0.03);
            }
        });

        // Click actions
        card.addEventListener('click', (e) => {
            if (typeof playBeep === 'function') {
                playBeep(640, 0.08);
            }
            openPlanetModal(body);
            updateCockpitTarget(body);
        });

        wrapper.appendChild(card);

        // Compute tag below card
        let categoryName = "";
        if (body.type === "star") categoryName = "Star";
        else if (body.type === "terrestrial") categoryName = "Terrestrial";
        else if (body.type === "gas-giant") categoryName = "Gas Giant";
        else if (body.type === "ice-giant") categoryName = "Ice Giant";
        else if (body.type === "dwarf") categoryName = "Dwarf Planet";
        
        const distFormatted = body.id === 'sun' ? '0 km' : (parseFloat(body.distance.replace(/,/g, '')) / 1000000).toFixed(1) + 'M km';

        const tags = document.createElement('div');
        tags.className = 'planet-meta-tags';
        tags.innerHTML = `<em>${categoryName}</em> · ${distFormatted}`;
        wrapper.appendChild(tags);

        planetGrid.appendChild(wrapper);
    });
}

function updateCockpitTarget(body) {
    const targetName = document.getElementById('target-name');
    const activeTelemetryPanel = document.querySelector('.active-planet-telemetry');
    
    targetName.textContent = body.name.toUpperCase();
    activeTelemetryPanel.querySelector('.target-card-small').innerHTML = `
        <div class="t-name font-orbitron" id="target-name">${body.name.toUpperCase()}</div>
        <div class="t-row"><span class="lbl">Distance:</span> <span class="val">${body.distance}</span></div>
        <div class="t-row"><span class="lbl">Orbital Vel:</span> <span class="val">${body.orbit}</span></div>
        <div class="t-row"><span class="lbl">Atmosphere:</span> <span class="val" style="font-size: 0.75rem;">${body.atmosphere.split(' (')[0]}</span></div>
    `;
    writeConsoleLog(`> Target locked: Scanning payload locked onto ${body.name}.`);
}

function filterAndSearchPlanets() {
    const query = searchInput.value.toLowerCase();
    const activeBtn = document.querySelector('.filter-btn.active');
    const filter = activeBtn.getAttribute('data-filter');

    const filtered = celestialData.filter(body => {
        const matchesSearch = body.name.toLowerCase().includes(query) || 
                              body.tagline.toLowerCase().includes(query);
        const matchesFilter = filter === 'all' || body.type === filter;
        return matchesSearch && matchesFilter;
    });

    if (filter === 'all' && query === '') {
        planetGrid.classList.add('all-active');
    } else {
        planetGrid.classList.remove('all-active');
    }

    renderPlanetCards(filtered);
}

searchInput.addEventListener('input', filterAndSearchPlanets);
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterAndSearchPlanets();
    });
});

// 7. Planet Details Modal & 60Hz Telemetry Counter
const modal = document.getElementById('planet-modal');
const modalSphere = document.getElementById('modal-sphere');
const modalName = document.getElementById('modal-name');
const modalType = document.getElementById('modal-type');
const modalTagline = document.getElementById('modal-tagline');
const modalOverviewText = document.getElementById('modal-overview-text');
const modalStructureText = document.getElementById('modal-structure-text');
const modalCosmicFact = document.getElementById('modal-cosmic-fact');
const modalKeyStats = document.getElementById('modal-key-stats');
const modalBarsContainer = document.getElementById('modal-bars-container');

const modalTabs = document.querySelectorAll('.modal-tab');
const modalPanes = document.querySelectorAll('.modal-tab-pane');
const modalCloseBtn = document.querySelector('.modal-close');
const modalBackdrop = document.querySelector('.modal-backdrop');

let liveTelemetryInterval = null;
let currentActivePlanet = null;

function openPlanetModal(planet) {
    currentActivePlanet = planet;
    
    modalSphere.className = `modal-planet-sphere ${planet.class}`;
    modalName.textContent = planet.name.toUpperCase();
    modalType.textContent = `${planet.type.toUpperCase()} CLASS BODY`;
    modalTagline.textContent = `SYS.DESIGNATION: ${planet.id.toUpperCase()}-01 // ${planet.tagline}`;
    modalOverviewText.textContent = planet.overview;
    modalStructureText.textContent = `Geological Core: ${planet.core}. Crust & Atmosphere details: ${planet.structure}`;
    modalCosmicFact.textContent = planet.funFact;

    modalKeyStats.innerHTML = `
        <div class="modal-stat-card">
            <span class="modal-stat-card-val">${planet.diameter}</span>
            <span class="modal-stat-card-lbl">Diameter</span>
        </div>
        <div class="modal-stat-card">
            <span class="modal-stat-card-val">${planet.escapeVelocity}</span>
            <span class="modal-stat-card-lbl">Escape Vel</span>
        </div>
        <div class="modal-stat-card">
            <span class="modal-stat-card-val">${planet.temp}</span>
            <span class="modal-stat-card-lbl">Average Temp</span>
        </div>
        <div class="modal-stat-card">
            <span class="modal-stat-card-val">${planet.moons} Moons</span>
            <span class="modal-stat-card-lbl">Satellite System</span>
        </div>
    `;

    modalBarsContainer.innerHTML = `
        <div class="stat-bar-item">
            <div class="stat-bar-meta">
                <span class="stat-bar-label">Mass (compared to Earth)</span>
                <span class="stat-bar-value">${planet.id === 'earth' ? '1.00x' : (planet.id === 'sun' ? '333,000x' : planet.stats.mass + 'x')}</span>
            </div>
            <div class="stat-bar-track">
                <div class="stat-bar-fill" style="width: 0%"></div>
            </div>
        </div>
        <div class="stat-bar-item">
            <div class="stat-bar-meta">
                <span class="stat-bar-label">Size / Radius (compared to Earth)</span>
                <span class="stat-bar-value">${planet.id === 'earth' ? '1.00x' : (planet.id === 'sun' ? '109x' : planet.stats.radius/10 + 'x')}</span>
            </div>
            <div class="stat-bar-track">
                <div class="stat-bar-fill" style="width: 0%"></div>
            </div>
        </div>
    `;

    // Reset tabs
    modalTabs.forEach(t => t.classList.remove('active'));
    modalPanes.forEach(p => p.classList.remove('active'));
    document.querySelector('.modal-tab[data-tab="overview"]').classList.add('active');
    document.getElementById('tab-overview').classList.add('active');

    // Show modal and start live telemetry tracking calculations at 30Hz
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    startLiveTelemetryTrack(planet);

    setTimeout(() => {
        const fills = modalBarsContainer.querySelectorAll('.stat-bar-fill');
        if (fills[0]) fills[0].style.width = `${Math.min(100, Math.max(3, planet.stats.mass * 3.5))}%`;
        if (fills[1]) fills[1].style.width = `${Math.min(100, Math.max(3, planet.stats.radius * 1.5))}%`;
    }, 150);
}

function startLiveTelemetryTrack(planet) {
    if (liveTelemetryInterval) clearInterval(liveTelemetryInterval);

    const distanceDisplay = document.getElementById('live-distance-val');
    const speedDisplay = document.getElementById('live-speed-val');
    const gravityDisplay = document.getElementById('live-gravity-val');

    // Base values parse
    let baseDistance = parseFloat(planet.distance.replace(/[^0-9]/g, '')) || 0;
    let baseSpeed = planet.orbit;
    
    speedDisplay.textContent = baseSpeed;
    gravityDisplay.textContent = planet.gravity;

    // Fast-updating telemetry readout
    liveTelemetryInterval = setInterval(() => {
        // Increment distance slightly to simulate active orbital transit
        baseDistance += (Math.random() - 0.48) * 4.2;
        distanceDisplay.innerHTML = `${Math.max(0, baseDistance).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} km`;
    }, 40);
}

function stopLiveTelemetryTrack() {
    if (liveTelemetryInterval) {
        clearInterval(liveTelemetryInterval);
        liveTelemetryInterval = null;
    }
}

function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = 'auto';
    stopLiveTelemetryTrack();
}

modalCloseBtn.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);

modalTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        modalTabs.forEach(t => t.classList.remove('active'));
        modalPanes.forEach(p => p.classList.remove('active'));
        
        tab.classList.add('active');
        const activeId = `tab-${tab.getAttribute('data-tab')}`;
        document.getElementById(activeId).classList.add('active');
    });
});

// 8. Space Trivia Exam Engine
const quizQuestions = [
    {
        question: "Which solar system planet has the highest density of all, meaning it would float in water last?",
        options: ["Earth", "Mercury", "Venus", "Neptune"],
        correct: 0,
        explanation: "Earth is the densest planet in the solar system (5.51 g/cm³), followed closely by Mercury and Venus."
    },
    {
        question: "Which spacecraft carried the Huygens lander probe down onto the surface of Titan in 2005?",
        options: ["Cassini", "Voyager 1", "Pioneer 11", "Galileo"],
        correct: 0,
        explanation: "The Cassini spacecraft carried the ESA Huygens probe, which landed on Titan, Saturn's largest moon, mapping its liquid methane lakes."
    },
    {
        question: "Which outer gas planet has the shortest day length, spinning fully in just 10 Earth hours?",
        options: ["Jupiter", "Saturn", "Uranus", "Neptune"],
        correct: 0,
        explanation: "Jupiter has the fastest rotation speed in our system. A day on Jupiter lasts only 9 hours and 56 minutes."
    },
    {
        question: "What is the escape velocity required to break free from Earth's gravity wells?",
        options: ["11.2 km/s", "5.0 km/s", "23.5 km/s", "615.0 km/s"],
        correct: 0,
        explanation: "To escape Earth's gravity pull and enter space transit, a spacecraft must reach 11.186 km/s (approx. 40,270 km/h)."
    },
    {
        question: "What is the chemical composition of the thick clouds trapping heat on Venus?",
        options: ["Sulfuric Acid", "Nitrogen", "Methane", "Water vapor"],
        correct: 0,
        explanation: "Venus' thick clouds are made of sulfuric acid droplets, reflecting 75% of sunlight and trapping carbon dioxide heat underneath."
    },
    {
        question: "Which dwarf body resides in the Main Asteroid Belt, separating Mars and Jupiter?",
        options: ["Ceres", "Pluto", "Eris", "Makemake"],
        correct: 0,
        explanation: "Ceres is the largest object and only dwarf planet located inside the asteroid belt between Mars and Jupiter."
    },
    {
        question: "At which Lagrange position is the James Webb Space Telescope stationed?",
        options: ["Lagrange Point 2 (L2)", "Lagrange Point 1 (L1)", "Lagrange Point 4 (L4)", "Earth Orbit (LEO)"],
        correct: 0,
        explanation: "JWST operates at L2, located 1.5 million km behind Earth, staying in line with Earth's shadow to keep its infrared sensors cold."
    },
    {
        question: "Which planet holds the fastest average orbital velocity around the Sun, travelling at 47.4 km/s?",
        options: ["Mercury", "Venus", "Earth", "Mars"],
        correct: 0,
        explanation: "Mercury, nearest to the Sun's deep gravity wells, orbits fastest (47.36 km/s) to maintain orbital balance."
    },
    {
        question: "Which ice giant planet has its poles facing directly towards the sun during its summer solstice?",
        options: ["Uranus", "Neptune", "Saturn", "Jupiter"],
        correct: 0,
        explanation: "Uranus has an extreme tilt of 97.77 degrees. Each pole faces the Sun for 21 consecutive years, causing extreme seasons."
    },
    {
        question: "What percentage of our Solar System's total mass is contained within the Sun?",
        options: ["99.86%", "95.50%", "90.00%", "99.00%"],
        correct: 0,
        explanation: "The Sun dominates our sector, containing 99.86% of all mass. Jupiter makes up most of the remaining 0.14%."
    }
];

let quizState = {
    currentIndex: 0,
    score: 0,
    answers: [],
    selectedOption: null
};

const quizIntro = document.getElementById('quiz-intro');
const quizQuestionScreen = document.getElementById('quiz-question-screen');
const quizResultsScreen = document.getElementById('quiz-results-screen');

const btnStartQuiz = document.getElementById('btn-start-quiz');
const btnNextQuestion = document.getElementById('btn-next-question');
const btnRestartQuiz = document.getElementById('btn-restart-quiz');

const questionIndexIndicator = document.getElementById('question-index');
const currentScoreIndicator = document.getElementById('current-score');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('quiz-options-container');
const quizFeedback = document.getElementById('quiz-feedback');
const quizProgressBar = document.getElementById('quiz-progress');

const finalScoreIndicator = document.getElementById('final-score');
const resultsFeedbackText = document.getElementById('results-feedback-text');

function startQuiz() {
    quizState.currentIndex = 0;
    quizState.score = 0;
    quizState.answers = [];
    quizState.selectedOption = null;

    quizIntro.classList.remove('active');
    quizResultsScreen.classList.remove('active');
    quizQuestionScreen.classList.add('active');

    showQuestion();
}

function showQuestion() {
    quizState.selectedOption = null;
    btnNextQuestion.setAttribute('disabled', 'true');
    quizFeedback.classList.remove('active');
    
    const currentQ = quizQuestions[quizState.currentIndex];
    
    const percent = (quizState.currentIndex / quizQuestions.length) * 100;
    quizProgressBar.style.width = `${percent}%`;

    questionIndexIndicator.textContent = `EXAM: Q${quizState.currentIndex + 1}/${quizQuestions.length}`;
    currentScoreIndicator.textContent = `SCORE: ${String(quizState.score * 10).padStart(3, '0')}`;
    
    questionText.textContent = currentQ.question;
    optionsContainer.innerHTML = '';

    currentQ.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option font-mono';
        btn.innerHTML = `
            <span>${opt}</span>
            <div class="option-indicator">${String.fromCharCode(65 + idx)}</div>
        `;

        btn.addEventListener('click', () => {
            if (quizState.selectedOption !== null) return;
            handleOptionSelect(idx, btn);
        });

        optionsContainer.appendChild(btn);
    });
}

function handleOptionSelect(idx, element) {
    quizState.selectedOption = idx;
    const currentQ = quizQuestions[quizState.currentIndex];
    const isCorrect = idx === currentQ.correct;

    const allOpts = optionsContainer.querySelectorAll('.quiz-option');

    if (isCorrect) {
        quizState.score++;
        element.classList.add('correct');
        playBeep(880, 0.2);
    } else {
        element.classList.add('wrong');
        allOpts[currentQ.correct].classList.add('correct');
        playBeep(220, 0.35);
    }

    currentScoreIndicator.textContent = `SCORE: ${String(quizState.score * 10).padStart(3, '0')}`;

    const icon = quizFeedback.querySelector('.feedback-icon');
    const text = quizFeedback.querySelector('.feedback-text');

    if (isCorrect) {
        icon.className = 'fa-solid fa-check feedback-icon';
        icon.style.color = 'var(--accent-green)';
        text.innerHTML = `<strong>TELEMETRY CORRECT.</strong> ${currentQ.explanation}`;
    } else {
        icon.className = 'fa-solid fa-xmark feedback-icon';
        icon.style.color = 'var(--accent-red)';
        text.innerHTML = `<strong>TELEMETRY ERROR.</strong> ${currentQ.explanation}`;
    }
    quizFeedback.classList.add('active');
    btnNextQuestion.removeAttribute('disabled');
}

btnNextQuestion.addEventListener('click', () => {
    quizState.currentIndex++;
    if (quizState.currentIndex < quizQuestions.length) {
        showQuestion();
    } else {
        showResults();
    }
});

function showResults() {
    quizProgressBar.style.width = '100%';
    quizQuestionScreen.classList.remove('active');
    quizResultsScreen.classList.add('active');

    finalScoreIndicator.textContent = `${quizState.score} / ${quizQuestions.length}`;
    
    let feedback = '';
    const ratio = quizState.score / quizQuestions.length;

    if (ratio === 1.0) {
        feedback = "> EXAM STATUS: EXCELLENT. COGNITIVE PATHS SYNCED. AUTHORIZATION GRANTED.";
    } else if (ratio >= 0.8) {
        feedback = "> EXAM STATUS: SATISFACTORY. COMMAND MODULE ACCESS INITIATED.";
    } else if (ratio >= 0.5) {
        feedback = "> EXAM STATUS: MINIMAL PASS. SECTOR TRANSIT RESTRICTIONS IN PLACE.";
    } else {
        feedback = "> EXAM STATUS: SYSTEM FAILURE. PILOT AUTHORIZATION REJECTED. INITIATING LOG RECALIBRATION.";
    }

    resultsFeedbackText.textContent = feedback;
    playBeep(440, 0.5);
}

btnStartQuiz.addEventListener('click', startQuiz);
btnRestartQuiz.addEventListener('click', startQuiz);

// Initialize Page Loader
window.addEventListener('load', () => {
    const container = document.getElementById('canvas-container');
    if (container && container.querySelector('canvas')) {
        const starfieldCanvas = document.getElementById('starfield');
        if (starfieldCanvas) starfieldCanvas.style.display = 'none';
    } else {
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        animateStars();
    }
    
    // Render registry cards
    planetGrid.classList.add('all-active');
    renderPlanetCards(celestialData);
});
