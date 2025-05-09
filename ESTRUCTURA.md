# PWA Music Player - Estructura de la Aplicación

## 1. Visión General

PWA Music Player es una aplicación web progresiva (PWA) para reproducción de música que funciona completamente offline, permite acceder a archivos de música locales, y proporciona una experiencia similar a aplicaciones nativas con capacidades de persistencia y control multimedia avanzado.

## 2. Tecnologías Principales

- **Vue 3**: Framework principal (Composition API)
- **Vue Router**: Para navegación entre vistas
- **File System Access API**: Para acceso a archivos locales del usuario
- **IndexedDB**: Para almacenamiento persistente de metadatos y referencias
- **localForage**: Biblioteca para simplificar el uso de IndexedDB
- **MediaSession API**: Para controles multimedia del sistema
- **Web Audio API**: Para procesamiento de audio (ecualizador, visualizador)
- **vite-plugin-pwa**: Para funcionalidades de instalación y offline

## 3. Estructura de Directorios

```
src/
  ├── assets/         # Recursos estáticos (imágenes, iconos)
  ├── components/     # Componentes Vue reutilizables
  ├── views/          # Componentes de vista/página principal
  ├── utils/          # Utilidades y servicios
  ├── store/          # Estado global de la aplicación
  ├── router/         # Configuración de rutas
  ├── styles/         # Archivos CSS
  ├── App.vue         # Componente raíz
  └── main.js         # Punto de entrada
```

## 4. Componentes Principales

### 4.1. Views (Vistas)

- **NowPlayingView**: Vista principal con reproductor y lista actual
- **EqualizerView**: Vista de ecualización y efectos de audio
- **PlaylistsView**: Vista para gestionar listas de reproducción
- **LyricsView**: Vista para mostrar letras de canciones
- **SettingsView**: Configuraciones de la aplicación

### 4.2. Components (Componentes Reutilizables)

- **AudioPlayer**: Núcleo de reproducción de audio
- **PlayerControls**: Controles de reproducción (play, pause, next, prev)
- **TrackList**: Lista genérica de pistas de audio
- **TrackItem**: Elemento individual de pista con acciones
- **LoadingProgress**: Indicador de progreso para cargas
- **VolumeControl**: Control de volumen
- **Equalizer**: Control de ecualización
- **Visualizer**: Visualizador de audio
- **PlaylistManager**: Gestor de listas de reproducción
- **AppHeader**: Encabezado de la aplicación
- **AppFooter**: Pie con controles persistentes
- **Tabs**: Sistema de navegación por pestañas

## 5. Servicios y Utilidades

### 5.1. Audio Manager (`utils/audioManager.js`)
- Gestión de reproducción de audio
- Implementación de Web Audio API
- Control de volumen, análisis de espectro
- Manejo de eventos de audio

### 5.2. Storage Manager (`utils/storageManager.js`)
- Abstracción de IndexedDB/localForage
- Almacenamiento de:
  - Metadatos de pistas
  - Preferencias de usuario
  - Listas de reproducción
  - Referencias a archivos locales

### 5.3. File System Manager (`utils/fileSystemManager.js`)
- Interfaz con File System Access API
- Escaneo de directorios
- Gestión de permisos para archivos
- Carga de archivos de audio

### 5.4. Playlist Manager (`utils/playlistManager.js`)
- Creación y edición de listas de reproducción
- Importación/exportación de listas
- Operaciones CRUD para listas

### 5.5. Metadata Parser (`utils/metadataParser.js`)
- Extracción de metadatos de archivos de audio
- Parseo de formatos de metadatos (ID3, etc.)
- Extracción de portadas e imágenes

### 5.6. Lyrics Manager (`utils/lyricsManager.js`)
- Carga y parseo de archivos de letras
- Sincronización de letras con tiempo
- Búsqueda de letras en archivos locales

## 6. Estado Global

### 6.1. Estado Principal (`store/playerStore.js`)
- Pista actual
- Estado de reproducción
- Lista de reproducción actual
- Historial y cola de reproducción
- Estado de volumen y configuración de audio

### 6.2. Estado de UI (`store/uiStore.js`)
- Tema visual
- Preferencias de visualización
- Estado de componentes de interfaz

## 7. Rutas

- `/` - Vista principal (NowPlaying)
- `/equalizer` - Ecualizador y efectos
- `/playlists` - Listas de reproducción
- `/lyrics` - Letras de canciones
- `/settings` - Configuración

## 8. Persistencia de Datos

### 8.1. Almacenamiento IndexedDB (mediante localForage)
- Metadatos de pistas
- Configuraciones del ecualizador
- Listas de reproducción personalizadas
- Favoritos
- Historial de reproducción
- Referencias a archivos locales
- Preferencias de usuario

### 8.2. Cache de Service Worker
- Recursos estáticos de la aplicación
- Archivos JS, CSS, HTML
- Iconos y recursos gráficos

## 9. Características Principales

### 9.1. Gestión de Archivos
- Selección de carpetas de música
- Escaneo recursivo de directorios
- Persistencia de referencias a archivos
- Soporte para múltiples formatos (MP3, FLAC, OGG, WAV)

### 9.2. Reproducción de Audio
- Controles básicos (play, pause, next, prev)
- Control de volumen
- Reproducción aleatoria
- Modos de repetición
- Cola de reproducción

### 9.3. Organización de Música
- Listas de reproducción personalizables
- Favoritos
- Filtrado por artista, álbum, género
- Búsqueda de pistas

### 9.4. Procesamiento de Audio
- Ecualización por bandas
- Efectos de audio (reverb, spatializer)
- Visualizador de espectro
- Normalización de volumen

### 9.5. Experiencia PWA
- Instalación como aplicación
- Funcionamiento offline completo
- Actualizaciones automáticas
- Integración con sistema (MediaSession API)

### 9.6. Interfaz de Usuario
- Diseño responsive
- Tema estilo Vaporwave
- Modo oscuro/claro
- Visualización de carátulas
- Animaciones y transiciones fluidas

## 10. Comportamiento Offline

- Almacenamiento de configuración en IndexedDB
- Cache de recursos estáticos con Service Worker
- Referencias persistentes a archivos locales
- Funcionalidad completa sin conexión a internet
- Notificación de actualizaciones disponibles al reconectar (opcional)

## 11. Esquemas de Color

### 11.1. Paleta Principal (Estilo Vaporwave)
- Primary: `#48CBA9` (turquesa)
- Secondary: `#E5156D` (rosa)
- Background: `#552A93` (morado)
- Accent: `#FDC47F` (naranja)
- Text/UI: `#3D758C` (azul grisáceo)

## 12. Flujos de Usuario

### 12.1. Primer Uso
1. Bienvenida y solicitud de permisos
2. Explicación de funcionalidades offline
3. Solicitud para seleccionar directorio de música
4. Escaneo inicial y configuración básica

### 12.2. Uso Normal
1. Carga de última configuración
2. Restauración de última pista/posición
3. Acceso a música previamente escaneada
4. Interacción con listas de reproducción

### 12.3. Gestión de Música
1. Selección de directorios
2. Escaneo y extracción de metadatos
3. Organización en listas de reproducción
4. Búsqueda y filtrado de música