import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Constantes y Configuración ---
const TILE_WIDTH = 1.8;
const TILE_HEIGHT = 2.5;
const TILE_DEPTH = 0.5;
const TILE_SPACING = 0.1; // Pequeño espacio entre fichas

const tileTypes = generateTileTypes(); // Genera los 144 tipos de fichas
const tiles = []; // Array para guardar los objetos de ficha
let activeTiles = 144; // Contador de fichas activas

let scene, camera, renderer, controls;
let raycaster, mouse;
let selectedTile = null;

// Elementos del DOM para info
const selectedInfoSpan = document.getElementById('selected-info');
const remainingInfoSpan = document.getElementById('remaining-info');

// --- Inicialización ---
function init() {
    // Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x336699);

    // Cámara
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 35, 35); // Posición inicial elevada

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // Habilitar sombras (opcional, consume más)
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 15);
    directionalLight.castShadow = true; // La luz proyecta sombras
    scene.add(directionalLight);

    // Controles de Órbita
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Movimiento más suave
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2 - 0.1; // Limitar ángulo para no ver desde abajo
    controls.minDistance = 15;
    controls.maxDistance = 80;

    // Raycaster para selección
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Crear el layout de las fichas
    createLayout();

    // Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('click', onMouseClick); // Usar 'click' es más intuitivo

    // Iniciar loop de animación
    animate();
}

// --- Generación de Fichas ---
function generateTileTypes() {
    const types = [];
    const suits = ['Círculo', 'Bambú', 'Carácter'];
    const honors = ['Viento', 'Dragón'];
    const specials = ['Flor', 'Estación'];

    // Palos (Suits): 3 palos * 9 números * 4 copias = 108
    for (const suit of suits) {
        for (let i = 1; i <= 9; i++) {
            for (let j = 0; j < 4; j++) {
                types.push({ type: 'Palo', name: `${suit} ${i}`, id: `${suit}-${i}` });
            }
        }
    }

    // Honores (Winds & Dragons): (4 vientos + 3 dragones) * 4 copias = 28
    const windNames = ['Este', 'Sur', 'Oeste', 'Norte'];
    const dragonNames = ['Rojo', 'Verde', 'Blanco'];
    for (const name of windNames) {
        for (let j = 0; j < 4; j++) {
            types.push({ type: 'Honor', name: `Viento ${name}`, id: `Viento-${name}` });
        }
    }
     for (const name of dragonNames) {
        for (let j = 0; j < 4; j++) {
            types.push({ type: 'Honor', name: `Dragón ${name}`, id: `Dragón-${name}` });
        }
    }

    // Especiales (Flowers & Seasons): 4 flores + 4 estaciones = 8 (solo 1 copia de cada)
    const flowerNames = ['Ciruelo', 'Orquídea', 'Crisantemo', 'BambúFlor']; // Nombres distintos para evitar confusión
    const seasonNames = ['Primavera', 'Verano', 'Otoño', 'Invierno'];
    for (const name of flowerNames) types.push({ type: 'Especial', name: `Flor ${name}`, id: 'Flor' }); // Mismo ID para emparejar
    for (const name of seasonNames) types.push({ type: 'Especial', name: `Estación ${name}`, id: 'Estación' }); // Mismo ID para emparejar

    if (types.length !== 144) {
        console.warn("¡Error en la generación de fichas! Total:", types.length);
    }

    // Barajar las fichas
    for (let i = types.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [types[i], types[j]] = [types[j], types[i]];
    }

    return types;
}

// --- Creación del Layout (Diseño Tortuga simplificado) ---
function createLayout() {
    // Coordenadas (x, y, z) del centro de cada ficha en unidades de "media ficha"
    // z=0 es la base, z=1 es la primera capa sobre la base, etc.
    // x e y son coordenadas en el plano horizontal.
    const layout = [
        // Capa 0 (Base) - Más ancha
        { x: 0, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }, { x: 4, y: 0, z: 0 }, { x: 6, y: 0, z: 0 }, { x: 8, y: 0, z: 0 }, { x: 10, y: 0, z: 0 }, { x: 12, y: 0, z: 0 }, { x: 14, y: 0, z: 0 }, { x: 16, y: 0, z: 0 }, { x: 18, y: 0, z: 0 }, { x: 20, y: 0, z: 0 }, { x: 22, y: 0, z: 0 },
        { x: 0, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 4, y: 2, z: 0 }, { x: 6, y: 2, z: 0 }, { x: 8, y: 2, z: 0 }, { x: 10, y: 2, z: 0 }, { x: 12, y: 2, z: 0 }, { x: 14, y: 2, z: 0 }, { x: 16, y: 2, z: 0 }, { x: 18, y: 2, z: 0 }, { x: 20, y: 2, z: 0 }, { x: 22, y: 2, z: 0 },
        { x: -2, y: 4, z: 0 }, { x: 0, y: 4, z: 0 }, { x: 2, y: 4, z: 0 }, { x: 4, y: 4, z: 0 }, { x: 6, y: 4, z: 0 }, { x: 8, y: 4, z: 0 }, { x: 10, y: 4, z: 0 }, { x: 12, y: 4, z: 0 }, { x: 14, y: 4, z: 0 }, { x: 16, y: 4, z: 0 }, { x: 18, y: 4, z: 0 }, { x: 20, y: 4, z: 0 }, { x: 22, y: 4, z: 0 }, { x: 24, y: 4, z: 0 },
        { x: -2, y: 6, z: 0 }, { x: 0, y: 6, z: 0 }, { x: 2, y: 6, z: 0 }, { x: 4, y: 6, z: 0 }, { x: 6, y: 6, z: 0 }, { x: 8, y: 6, z: 0 }, { x: 10, y: 6, z: 0 }, { x: 12, y: 6, z: 0 }, { x: 14, y: 6, z: 0 }, { x: 16, y: 6, z: 0 }, { x: 18, y: 6, z: 0 }, { x: 20, y: 6, z: 0 }, { x: 22, y: 6, z: 0 }, { x: 24, y: 6, z: 0 },
        { x: 0, y: 8, z: 0 }, { x: 2, y: 8, z: 0 }, { x: 4, y: 8, z: 0 }, { x: 6, y: 8, z: 0 }, { x: 8, y: 8, z: 0 }, { x: 10, y: 8, z: 0 }, { x: 12, y: 8, z: 0 }, { x: 14, y: 8, z: 0 }, { x: 16, y: 8, z: 0 }, { x: 18, y: 8, z: 0 }, { x: 20, y: 8, z: 0 }, { x: 22, y: 8, z: 0 },
        { x: 0, y: 10, z: 0 }, { x: 2, y: 10, z: 0 }, { x: 4, y: 10, z: 0 }, { x: 6, y: 10, z: 0 }, { x: 8, y: 10, z: 0 }, { x: 10, y: 10, z: 0 }, { x: 12, y: 10, z: 0 }, { x: 14, y: 10, z: 0 }, { x: 16, y: 10, z: 0 }, { x: 18, y: 10, z: 0 }, { x: 20, y: 10, z: 0 }, { x: 22, y: 10, z: 0 },
        // Capa 1
        { x: 6, y: 2, z: 1 }, { x: 8, y: 2, z: 1 }, { x: 10, y: 2, z: 1 }, { x: 12, y: 2, z: 1 }, { x: 14, y: 2, z: 1 }, { x: 16, y: 2, z: 1 },
        { x: 6, y: 4, z: 1 }, { x: 8, y: 4, z: 1 }, { x: 10, y: 4, z: 1 }, { x: 12, y: 4, z: 1 }, { x: 14, y: 4, z: 1 }, { x: 16, y: 4, z: 1 },
        { x: 6, y: 6, z: 1 }, { x: 8, y: 6, z: 1 }, { x: 10, y: 6, z: 1 }, { x: 12, y: 6, z: 1 }, { x: 14, y: 6, z: 1 }, { x: 16, y: 6, z: 1 },
        { x: 6, y: 8, z: 1 }, { x: 8, y: 8, z: 1 }, { x: 10, y: 8, z: 1 }, { x: 12, y: 8, z: 1 }, { x: 14, y: 8, z: 1 }, { x: 16, y: 8, z: 1 },
        // Capa 2
        { x: 8, y: 4, z: 2 }, { x: 10, y: 4, z: 2 }, { x: 12, y: 4, z: 2 }, { x: 14, y: 4, z: 2 },
        { x: 8, y: 6, z: 2 }, { x: 10, y: 6, z: 2 }, { x: 12, y: 6, z: 2 }, { x: 14, y: 6, z: 2 },
        // Capa 3
        { x: 10, y: 4, z: 3 }, { x: 12, y: 4, z: 3 },
        { x: 10, y: 6, z: 3 }, { x: 12, y: 6, z: 3 },
        // Capa 4 (Cima)
        { x: 11, y: 5, z: 4 },
        // Fichas especiales a los lados
        { x: -4, y: 5, z: 0 }, // Izquierda extrema
        { x: 26, y: 5, z: 0 }, // Derecha extrema 1
        { x: 28, y: 5, z: 0 }  // Derecha extrema 2 (Ajusta si se solapa mucho)
    ];

    if (layout.length > tileTypes.length) {
        console.error("¡El layout tiene más posiciones que fichas disponibles!");
        return;
    }

    const tileGeometry = new THREE.BoxGeometry(TILE_WIDTH, TILE_HEIGHT, TILE_DEPTH);

    // Calcular centro del layout para centrar en la escena
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    layout.forEach(pos => {
        minX = Math.min(minX, pos.x);
        maxX = Math.max(maxX, pos.x);
        minY = Math.min(minY, pos.y);
        maxY = Math.max(maxY, pos.y);
    });
    const centerX = (minX + maxX) / 2 * (TILE_WIDTH / 2 + TILE_SPACING / 2);
    const centerY = (minY + maxY) / 2 * (TILE_HEIGHT / 2 + TILE_SPACING / 2);


    // Crear y posicionar cada ficha
    for (let i = 0; i < layout.length; i++) {
        const pos = layout[i];
        const tileData = tileTypes[i];

        // Materiales: uno para la cara, otro para los lados/base
        const faceMaterial = createTileFaceMaterial(tileData); // Material con la "imagen"
        const sideMaterial = new THREE.MeshStandardMaterial({ color: 0xf0e68c }); // Color hueso para lados/base

        const materials = [
            sideMaterial,       // Right side (+x)
            sideMaterial,       // Left side (-x)
            sideMaterial,       // Top side (+y) - ¡OJO! Three.js usa Y como altura por defecto, pero aquí Y es horizontal
            sideMaterial,       // Bottom side (-y)
            faceMaterial,       // Front side (+z) - La cara visible
            sideMaterial        // Back side (-z)
        ];

        const tileMesh = new THREE.Mesh(tileGeometry, materials);

        // Calcular posición en el mundo 3D
        const worldX = pos.x * (TILE_WIDTH / 2 + TILE_SPACING / 2) - centerX;
        const worldY = pos.z * (TILE_DEPTH + TILE_SPACING) + TILE_DEPTH / 2; // Z del layout es la altura (Y en Three.js)
        const worldZ = -pos.y * (TILE_HEIGHT / 2 + TILE_SPACING / 2) + centerY; // Y del layout es la profundidad (Z en Three.js, negativo para alejar)

        tileMesh.position.set(worldX, worldY, worldZ);
        tileMesh.castShadow = true;
        tileMesh.receiveShadow = true;

        // Guardar información útil en el objeto Mesh
        tileMesh.userData = {
            id: tileData.id, // El ID para comparar (e.g., 'Círculo-5', 'Flor', 'Estación')
            name: tileData.name, // Nombre completo para mostrar
            gridPos: pos, // Posición en la cuadrícula del layout (x, y, z)
            isTile: true,
            removed: false,
            originalMaterial: faceMaterial,
            selected: false
        };

        scene.add(tileMesh);
        tiles.push(tileMesh); // Añadir a nuestra lista de fichas
    }
     console.log(`Creadas ${tiles.length} fichas.`);
     updateRemainingCount();
}

// --- Material de la Cara de la Ficha (Simplificado) ---
function createTileFaceMaterial(tileData) {
    // ¡Aquí es donde cargarías texturas reales!
    // Por ahora, usamos colores y texto simple.

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 128; // Tamaño de textura potencia de 2 es bueno
    canvas.height = 160; // Relación similar a TILE_WIDTH/TILE_HEIGHT

    // Fondo
    context.fillStyle = '#FFFFE0'; // Un color crema
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#000000';
    context.lineWidth = 2;
    context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);


    // Texto simple para identificar la ficha
    context.fillStyle = '#333333';
    context.font = 'bold 20px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // Dividir el nombre para que quepa mejor
    const nameParts = tileData.name.split(' ');
    if (nameParts.length > 1) {
         context.fillText(nameParts[0], canvas.width / 2, canvas.height / 2 - 12);
         context.fillText(nameParts[1], canvas.width / 2, canvas.height / 2 + 12);
    } else {
        context.fillText(tileData.name, canvas.width / 2, canvas.height / 2);
    }


    const texture = new THREE.CanvasTexture(canvas);
    return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8, metalness: 0.1 });
}


// --- Lógica del Juego ---

function isTileFree(tile) {
    if (tile.userData.removed) return false; // Ya eliminada

    const gridPos = tile.userData.gridPos;

    // 1. ¿Hay alguna ficha encima?
    const tileAbove = findTileAt(gridPos.x, gridPos.y, gridPos.z + 1);
    if (tileAbove && !tileAbove.userData.removed) {
        //console.log(`Tile at ${gridPos.x},${gridPos.y},${gridPos.z} blocked by tile above`);
        return false;
    }

    // 2. ¿Está libre a izquierda O derecha?
    const tileLeft = findTileAt(gridPos.x - 2, gridPos.y, gridPos.z); // Se comprueba a 2 unidades por la coord. de centro
    const tileRight = findTileAt(gridPos.x + 2, gridPos.y, gridPos.z);

    const isBlockedOnLeft = tileLeft && !tileLeft.userData.removed;
    const isBlockedOnRight = tileRight && !tileRight.userData.removed;

    if (isBlockedOnLeft && isBlockedOnRight) {
         //console.log(`Tile at ${gridPos.x},${gridPos.y},${gridPos.z} blocked on both sides`);
        return false; // Bloqueada en ambos lados
    }

    // Si no está bloqueada por encima y al menos un lado está libre, es libre
    return true;
}

function findTileAt(x, y, z) {
    // Busca una ficha en la posición de cuadrícula dada
    // Es importante que las coordenadas del layout (x, y, z) sean únicas
    for (const tile of tiles) {
        if (!tile.userData.removed &&
            tile.userData.gridPos.x === x &&
            tile.userData.gridPos.y === y &&
            tile.userData.gridPos.z === z) {
            return tile;
        }
    }
    return null; // No se encontró ficha activa en esa posición
}

function selectTile(tile) {
    if (!tile || !tile.userData.isTile || tile.userData.removed || !isTileFree(tile)) {
        deselectCurrent(); // Deseleccionar si se hace clic en espacio vacío o ficha no válida
        return;
    }

    console.log("Clicked on:", tile.userData.name, "at", tile.userData.gridPos);

    if (!selectedTile) {
        // Primera selección
        selectedTile = tile;
        highlightTile(tile, true);
        selectedInfoSpan.textContent = tile.userData.name;
    } else {
        // Segunda selección - comprobar pareja
        if (selectedTile === tile) {
            // Clic en la misma ficha: deseleccionar
            deselectCurrent();
            return;
        }

        if (tilesMatch(selectedTile, tile)) {
            // ¡Pareja encontrada!
            console.log("Match found:", selectedTile.userData.name, "and", tile.userData.name);
            removeTile(selectedTile);
            removeTile(tile);
            activeTiles -= 2;
            updateRemainingCount();
            deselectCurrent(); // Limpiar selección
            checkWinCondition();
            // Opcional: Añadir aquí la comprobación de "no más movimientos"
        } else {
            // No son pareja, deseleccionar la anterior y seleccionar la nueva
             console.log("No match.");
            deselectCurrent();
            selectedTile = tile;
            highlightTile(tile, true);
            selectedInfoSpan.textContent = tile.userData.name;
        }
    }
}

function tilesMatch(tile1, tile2) {
    // Las fichas normales deben tener el mismo ID
    // Las flores emparejan con cualquier flor, las estaciones con cualquier estación
    return tile1.userData.id === tile2.userData.id;
}

function highlightTile(tile, selected) {
     if (!tile || !tile.material) return; // Asegurarse de que la ficha y su material existen

    // Intentar acceder al material de la cara (índice 4)
    const faceMaterial = Array.isArray(tile.material) ? tile.material[4] : tile.material;

    if (faceMaterial instanceof THREE.MeshStandardMaterial) {
        if (selected) {
            tile.userData.selected = true;
            // Guardar color original si no se ha hecho ya
            if (faceMaterial.userData.originalEmissive === undefined) {
                 faceMaterial.userData.originalEmissive = faceMaterial.emissive.getHex();
            }
            faceMaterial.emissive.setHex(0x00ff00); // Verde brillante al seleccionar
            faceMaterial.needsUpdate = true; // Importante para que se aplique el cambio
        } else {
            tile.userData.selected = false;
            // Restaurar color emisivo original si existe
            if (faceMaterial.userData.originalEmissive !== undefined) {
                faceMaterial.emissive.setHex(faceMaterial.userData.originalEmissive);
            } else {
                 faceMaterial.emissive.setHex(0x000000); // Por defecto, sin emisión
            }
            faceMaterial.needsUpdate = true;
        }
    } else {
        console.warn("El material de la cara no es MeshStandardMaterial", faceMaterial);
    }
}


function deselectCurrent() {
    if (selectedTile) {
        highlightTile(selectedTile, false);
    }
    selectedTile = null;
    selectedInfoSpan.textContent = "Ninguna";
}

function removeTile(tile) {
    tile.userData.removed = true;
    // En lugar de quitarla de la escena (que complica el raycasting y la lógica),
    // simplemente la hacemos invisible.
    tile.visible = false;

    // Opcional: una pequeña animación de desaparición podría ir aquí.
}

function updateRemainingCount() {
     remainingInfoSpan.textContent = activeTiles;
}

function checkWinCondition() {
    if (activeTiles === 0) {
        alert("¡Felicidades! ¡Has ganado!");
        // Aquí podrías añadir opción de reiniciar, etc.
    }
    // Aquí también se podría llamar a checkNoMoreMoves()
}

// --- Manejadores de Eventos ---
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseClick(event) {
    // Calcular posición del ratón en coordenadas normalizadas (-1 a +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Actualizar el raycaster con la cámara y la posición del ratón
    raycaster.setFromCamera(mouse, camera);

    // Calcular objetos que intersectan el rayo
    // Importante: Intersectar solo con las fichas visibles y no eliminadas
    const intersects = raycaster.intersectObjects(tiles.filter(t => t.visible && !t.userData.removed));

    if (intersects.length > 0) {
        // El primer objeto es el más cercano
        const clickedObject = intersects[0].object;
        if (clickedObject.userData.isTile) {
             selectTile(clickedObject);
        } else {
            deselectCurrent(); // Clic en algo que no es ficha
        }
    } else {
         deselectCurrent(); // Clic en el fondo
    }
}

// --- Loop de Animación ---
function animate() {
    requestAnimationFrame(animate);

    controls.update(); // Actualizar controles de órbita

    renderer.render(scene, camera);
}

// --- Iniciar el juego ---
init();