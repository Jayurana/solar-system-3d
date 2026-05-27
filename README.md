# Orion Cosmos - Holographic Space Observatory & Portal

Orion Cosmos is an interactive, premium web-based 3D Solar System flight deck and celestial registry. Modeled after futuristic spaceship bridges and modern space science portals, it blends 3D WebGL rendering, native audio synthesis, space telemetry calculations, and interactive exploration logs.

## 🚀 Key Features

*   **Dynamic WebGL Background (Three.js)**: Features real-time rendered orbiting planets, ecliptic grids, and star fields. Includes a **Constellation Mode** toggle to render cosmic constellation lines with mouse-movement parallax.
*   **Holographic Flight Deck**: A cockpit control board featuring setting toggles, warp speed multipliers, diagnostic logs, and sound controllers.
*   **3D Orbit Simulator**: An embedded cockpit display housing the **Solar System Scope** real-time simulation.
*   **Stellar Registry (Encyclopedia)**: An interactive planetary database featuring chemical compositions, escape velocities, core structures, and a **30Hz Live Distance Calculator** showing orbital transits in real-time.
*   **Native Space Synthesizer**: Uses the Web Audio API to procedurally generate a warp hum (55Hz), stellar wind noise, and telemetry click indicators natively in the browser without asset downloads.
*   **Space Flight Timeline**: Details historical NASA and international milestones (Voyager, Hubble, Cassini, Webb).
*   **Trivia Examination**: A 10-question space physics and history verification challenge for flight cadets.

## 🛠️ Local Setup

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Jayurana/solar-system-3d.git
    cd solar-system-3d
    ```
2.  **Run a Local Server**:
    Since this is a vanilla HTML/CSS/JS application, you can run it via any local web server:
    *   Python: `python -m http.server 8080`
    *   Node/npx: `npx http-server`
3.  **Open in Browser**:
    Navigate to `http://localhost:8080` in your web browser (Chrome recommended for optimal Web Audio rendering).

## 🪐 Credits & Resources

*   **3D Embed**: Provided by [Solar System Scope](https://www.solarsystemscope.com/).
*   **Stellar Telemetry & Reference**: Inspired by the [NASA Solar System Portal](https://science.nasa.gov/solar-system/).
*   **Libraries**: Built with [Three.js](https://threejs.org/) and styled with [FontAwesome](https://fontawesome.com/) icons.

---
*Created as part of the Orion Cosmos Observatory Project. Verified 2026.*
