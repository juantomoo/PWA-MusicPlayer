# PWA Music Player

Aplicación web progresiva para reproducción de música local con una moderna interfaz estilo vaporwave. Permite reproducir archivos MP3, FLAC, OGG y WAV directamente desde los directorios del usuario. La aplicación funciona completamente offline, no recolecta información privada y permite disfrutar de tu música con controles multimedia del sistema operativo incluso cuando el navegador no está en primer plano.

![PWA Music Player](./pwa-musicplayer-icon.png)

## Características principales

- **Reproductor de música completo**:
  - Reproducción de archivos locales desde directorios del usuario
  - Soporte para formatos MP3, FLAC, OGG y WAV
  - Funcionamiento en segundo plano con controles multimedia del sistema
  - Soporte para listas de reproducción personalizadas

- **Interfaz moderna y funcional**:
  - Diseño estilo vaporwave con temas oscuros
  - Vista de reproducción actual con información detallada
  - Visualización de playlist en formato de tabla ordenable y filtrable
  - Vista de listas de reproducción organizadas

- **Opciones avanzadas**:
  - Ecualizador de audio de 5 bandas
  - Control de volumen y normalización
  - Modo aleatorio y repetición
  - Visualización de letras de canciones (cuando hay archivos disponibles)

- **Características PWA**:
  - Instalable como aplicación nativa
  - Funcionamiento 100% offline tras la instalación
  - Notificaciones de actualizaciones
  - Persistencia de configuración entre sesiones

## Público objetivo
La aplicación está diseñada para melómanos que tienen sus propios archivos de música y no quieren usar reproductores de mala calidad que recogen información del usuario y muestran comerciales, solo la clásica reproducción fluida y sin límites como lo hicieron las mejores aplicaciones en los años 90, ahora admitiendo los formatos actuales, tecnología moderna y dispositivos móviles.

## Uso y navegación

### Vistas principales

- **Reproduciendo**: Muestra la canción actual con sus datos y carátula
- **Playlists**: Permite gestionar y reproducir listas de reproducción
- **Ecualizador**: Ajusta las frecuencias del audio para una mejor experiencia
- **Letras**: Visualiza las letras de las canciones cuando están disponibles

### Controles de reproducción

Los controles principales están disponibles en la parte inferior de la aplicación y permiten:

- Reproducir/pausar
- Avanzar/retroceder pistas
- Ajustar volumen
- Activar/desactivar modos de repetición y aleatorio

### Gestión de playlists

En la vista de Playlists puedes:

1. Crear nuevas listas de reproducción
2. Seleccionar directorios de música para escanear
3. Ordenar las canciones por título, artista o álbum
4. Filtrar canciones mediante la barra de búsqueda
5. Reproducir cualquier pista con un solo clic

## Instalación y desarrollo

```sh
# Clona el repositorio
git clone https://github.com/juantomoo/PWA-MusicPlayer
cd PWA-MusicPlayer

# Instala las dependencias
npm install

# Ejecuta el servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Previsualiza el build
npm run preview
```

## Probar funcionalidad PWA y offline

1. Ejecuta `npm run build` y luego `npm run preview`
2. Abre la app en tu navegador y accede a las DevTools > Application > Service Workers para verificar el registro
3. Instala la app desde el navegador (icono de instalación PWA)
4. Prueba la funcionalidad offline recargando la app sin conexión

## Permisos requeridos

- **Sistema de archivos**: Para acceder a los archivos de música local (se solicita al usuario)
- **Speakers/Audio**: Para reproducir audio y aplicar efectos
- **Media Session API**: Para controlar la reproducción desde los controles multimedia del sistema

## Stack tecnológico

- **Framework**: Vue 3 + Vite
- **Estado global**: Pinia
- **Almacenamiento**: LocalForage (IndexedDB)
- **Audio**: Web Audio API
- **PWA**: Vite PWA Plugin
- **Metadatos de audio**: jsmediatags

## Estructura del proyecto

- `/public`: Assets estáticos, manifest.webmanifest, íconos PWA
- `/src/assets`: Imágenes y recursos procesados por Vite
- `/src/components`: Componentes Vue reutilizables
- `/src/views`: Vistas principales de la aplicación
- `/src/router`: Configuración de rutas (Vue Router)
- `/src/store`: Gestión de estado con Pinia
- `/src/utils`: Utilidades para audio, playlists y permisos

## Actualizaciones recientes

### Versión 1.1.0
- Rediseño completo de la interfaz de usuario
- Transformación de la vista de playlists a tabla ordenable y filtrable
- Mejora de la vista de reproducción actual
- Integración optimizada entre componentes
- Corrección de problemas con los permisos de archivos
- Mejora en el manejo de metadatos de canciones

### Versión 1.0.0
- Lanzamiento inicial

## Próximas características

- Sincronización con servicios en la nube
- Soporte para listas de reproducción M3U, PLS y XSPF
- Visualizaciones de audio personalizables
- Soporte para podcasts
- Mejoras en la gestión de metadatos

## Licencia

MIT

---
Desarrollado por HISQUE Estudio (<explora@hisque.com.co>)
