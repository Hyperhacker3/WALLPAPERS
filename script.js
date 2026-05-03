// Configuración del Servidor de Imágenes
const R2_BASE_URL = 'https://pub-254d1157d88e40218b3c1ec4a04380b0.r2.dev/';

// Base de Datos Local de Wallpapers
const DB = [
    {
        id: 'elden-ring',
        name: 'Elden Ring',
        themeClass: 'theme-elden-ring',
        cover: `${R2_BASE_URL}eldenring.jpg`,
        wallpapers: [
            {
                id: 'er-1',
                thumb: `${R2_BASE_URL}malenia_1_720p.jpg`,
                url: `${R2_BASE_URL}malenia_1.png`
            }
        ]
    },
    {
        id: 'sekiro',
        name: 'Sekiro: Shadows Die Twice',
        themeClass: 'theme-sekiro',
        cover: `${R2_BASE_URL}sekiro.jpg`,
        wallpapers: [
            {
                id: 'sek-1',
                thumb: `${R2_BASE_URL}sekiro_1_720p.jpg`,
                url: `${R2_BASE_URL}sekiro_1.png`
            }
        ]
    },
    {
        id: 'nfs',
        name: 'Need for Speed: MW',
        themeClass: 'theme-nfs',
        cover: `${R2_BASE_URL}nfs_mw.jpg`,
        wallpapers: [
            {
                id: 'nfs-1',
                thumb: `${R2_BASE_URL}bmw_m3_gtr_1_720.jpg`,
                url: `${R2_BASE_URL}bmw_m3_gtr_1.png`
            }
        ]
    }
];

// Estado de la Aplicación
const state = {
    currentGame: null,
    currentWallpaper: null,
    downloadTimer: null,
    blobUrl: null
};

// Referencias al DOM
const dom = {
    body: document.body,
    views: {
        home: document.getElementById('home-view'),
        gallery: document.getElementById('gallery-view'),
        preview: document.getElementById('preview-view'),
        download: document.getElementById('download-view'),
        legal: document.getElementById('legal-view')
    },
    homeGrid: document.getElementById('home-grid'),
    galleryGrid: document.getElementById('gallery-grid'),
    galleryTitle: document.getElementById('gallery-title'),
    previewImage: document.getElementById('preview-image'),
    goToDownloadBtn: document.getElementById('go-to-download-btn'),
    downloadThumbnail: document.getElementById('download-thumbnail'),
    countdownContainer: document.getElementById('countdown-container'),
    downloadReadyContainer: document.getElementById('download-ready-container'),
    timerDisplay: document.getElementById('countdown-timer'),
    backupDownloadBtn: document.getElementById('backup-download-btn'),
    legalTitle: document.getElementById('legal-title'),
    legalContents: {
        privacy: document.getElementById('legal-privacy'),
        notice: document.getElementById('legal-notice'),
        terms: document.getElementById('legal-terms'),
        cookies: document.getElementById('legal-cookies')
    }
};

// Control de Vistas (SPA Router Básico)
window.app = {
    init() {
        this.renderHome();
        
        // Asignar evento al botón de respaldo
        dom.backupDownloadBtn.addEventListener('click', () => {
            if(state.blobUrl) {
                this.triggerDownload(state.blobUrl, `wallpaper-${state.currentWallpaper.id}.jpg`);
            }
        });

        // Asignar evento al botón de descargar desde previsualización
        if(dom.goToDownloadBtn) {
            dom.goToDownloadBtn.addEventListener('click', () => {
                if(state.currentWallpaper) {
                    this.showDownload(state.currentWallpaper.id);
                }
            });
        }
        
        // Configurar estado inicial de la historia (History API)
        history.replaceState({ view: 'home' }, '', '#home');

        // Escuchar los botones de Atrás/Adelante del mouse o navegador
        window.addEventListener('popstate', (e) => {
            if (e.state) {
                const s = e.state;
                if (s.view === 'home') this.showHome(false);
                else if (s.view === 'gallery') this.showGallery(s.gameId, false);
                else if (s.view === 'preview') {
                    state.currentGame = DB.find(g => g.id === s.gameId);
                    this.showPreview(s.wallpaperId, false);
                }
                else if (s.view === 'download') {
                    state.currentGame = DB.find(g => g.id === s.gameId);
                    this.showDownload(s.wallpaperId, false);
                }
                else if (s.view === 'legal') {
                    this.showLegal(s.legalType, false);
                }
            }
        });
    },

    switchView(viewName) {
        // Ocultar todas las vistas
        Object.values(dom.views).forEach(view => {
            view.classList.remove('active');
            setTimeout(() => {
                if(!view.classList.contains('active')) {
                    view.classList.add('hidden');
                }
            }, 500); // Tiempo de la transición CSS
        });

        // Mostrar la vista solicitada
        const targetView = dom.views[viewName];
        targetView.classList.remove('hidden');
        // Pequeño retraso para permitir que display:block se aplique antes de animar opacidad
        setTimeout(() => {
            targetView.classList.add('active');
        }, 50);
    },

    setTheme(themeClass) {
        // Limpiar temas anteriores
        dom.body.className = '';
        if (themeClass) {
            dom.body.classList.add(themeClass);
        } else {
            dom.body.classList.add('theme-default');
        }
    },

    showHome(push = true) {
        this.setTheme(null);
        this.switchView('home');
        
        // Limpiar estado
        state.currentGame = null;
        state.currentWallpaper = null;

        if (push) {
            history.pushState({ view: 'home' }, '', '#home');
        }
    },

    showLegal(type, push = true) {
        // Ocultar todos los contenidos legales
        Object.values(dom.legalContents).forEach(el => {
            if(el) el.classList.add('hidden');
        });

        // Mostrar el contenido solicitado
        const target = dom.legalContents[type];
        if (!target) return this.showHome(push);
        
        target.classList.remove('hidden');

        // Actualizar título de la vista (extraer del h2)
        const h2 = target.querySelector('h2');
        if (h2) dom.legalTitle.textContent = h2.textContent;

        this.setTheme(null);
        this.switchView('legal');

        if (push) {
            history.pushState({ view: 'legal', legalType: type }, '', `#legal-${type}`);
        }
    },

    showGallery(gameId, push = true) {
        // Si se llama desde "Volver" no pasará gameId, usamos el del estado
        const id = gameId || (state.currentGame ? state.currentGame.id : null);
        if (!id) return this.showHome(push);

        const game = DB.find(g => g.id === id);
        if (!game) return;

        state.currentGame = game;
        this.setTheme(game.themeClass);
        this.renderGallery(game);
        this.switchView('gallery');
        
        // Limpiar estado de descarga
        this.clearDownloadState();

        if (push) {
            history.pushState({ view: 'gallery', gameId: id }, '', `#gallery-${id}`);
        }
    },

    showPreview(wallpaperId, push = true) {
        if (!state.currentGame) return this.showHome(push);

        const wallpaper = state.currentGame.wallpapers.find(w => w.id === wallpaperId);
        if (!wallpaper) return;

        state.currentWallpaper = wallpaper;
        
        // El preview usa la imagen 720p para visualización a pantalla completa
        dom.previewImage.src = wallpaper.thumb;
        
        this.switchView('preview');

        if (push) {
            history.pushState({ view: 'preview', gameId: state.currentGame.id, wallpaperId: wallpaperId }, '', `#preview-${wallpaperId}`);
        }
    },

    showDownload(wallpaperId, push = true) {
        if (!state.currentGame) return this.showHome(push);

        const wallpaper = state.currentGame.wallpapers.find(w => w.id === wallpaperId);
        if (!wallpaper) return;

        state.currentWallpaper = wallpaper;
        
        // Preparar UI de descarga
        dom.downloadThumbnail.src = wallpaper.thumb;
        this.resetDownloadUI();
        
        this.switchView('download');
        
        // Iniciar el proceso de descarga
        this.startDownloadProcess(wallpaper);

        if (push) {
            history.pushState({ view: 'download', gameId: state.currentGame.id, wallpaperId: wallpaperId }, '', `#download-${wallpaperId}`);
        }
    },

    // Métodos de Renderizado
    renderHome() {
        dom.homeGrid.innerHTML = '';
        
        // Renderizar juegos existentes
        DB.forEach(game => {
            const card = document.createElement('div');
            card.className = 'card';
            card.onclick = () => this.showGallery(game.id);
            
            card.innerHTML = `
                <div class="card-image-wrapper">
                    <img src="${game.cover}" alt="${game.name}">
                </div>
                <div class="card-content">
                    <h2>${game.name}</h2>
                </div>
            `;
            dom.homeGrid.appendChild(card);
        });

        // Renderizar plantilla en blanco (Futuras Categorías)
        const emptyCard = document.createElement('div');
        emptyCard.className = 'card empty-card';
        emptyCard.innerHTML = `
            <h2>+ Próximamente</h2>
            <p>Nuevas categorías</p>
        `;
        dom.homeGrid.appendChild(emptyCard);
    },

    renderGallery(game) {
        dom.galleryTitle.textContent = game.name;
        dom.galleryGrid.innerHTML = '';

        game.wallpapers.forEach(wp => {
            const card = document.createElement('div');
            card.className = 'wallpaper-card';
            card.onclick = () => window.app.showPreview(wp.id);
            
            card.innerHTML = `
                <img src="${wp.thumb}" alt="Wallpaper" loading="lazy">
                <div class="wallpaper-overlay">
                    <span>Ver Previsualización</span>
                </div>
            `;
            dom.galleryGrid.appendChild(card);
        });
    },

    // Lógica de Descarga
    resetDownloadUI() {
        dom.countdownContainer.classList.remove('hidden');
        dom.downloadReadyContainer.classList.add('hidden');
        dom.countdownTimer.textContent = '5';
    },

    clearDownloadState() {
        if (state.downloadTimer) clearInterval(state.downloadTimer);
        if (state.blobUrl) {
            URL.revokeObjectURL(state.blobUrl);
            state.blobUrl = null;
        }
    },

    startDownloadProcess(wallpaper) {
        this.clearDownloadState();
        let secondsLeft = 5;
        
        state.downloadTimer = setInterval(() => {
            secondsLeft--;
            dom.countdownTimer.textContent = secondsLeft;
            
            if (secondsLeft <= 0) {
                clearInterval(state.downloadTimer);
                this.executeDownload(wallpaper.url, `${state.currentGame.id}-wallpaper-${wallpaper.id}.jpg`);
            }
        }, 1000);
    },

    async executeDownload(url, filename) {
        try {
            // Mostrar UI de proceso
            dom.countdownContainer.classList.add('hidden');
            dom.downloadReadyContainer.classList.remove('hidden');
            
            // Realizar Fetch de la imagen
            const response = await fetch(url);
            
            if (!response.ok) throw new Error('Network response was not ok');
            
            // Convertir a Blob
            const blob = await response.blob();
            
            // Crear Object URL
            state.blobUrl = URL.createObjectURL(blob);
            
            // Forzar descarga
            this.triggerDownload(state.blobUrl, filename);
            
        } catch (error) {
            console.error("Error al descargar la imagen:", error);
            alert("Hubo un error al intentar descargar la imagen. Asegúrate de que el CORS esté configurado correctamente en el servidor.");
            // Reset UI for retry
            this.resetDownloadUI();
        }
    },

    triggerDownload(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
};

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app.init();
});
