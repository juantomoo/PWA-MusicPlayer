# PWA Music Player

Aplicación web offline para reproducción de música de los directorios del usuario con sus respectivos formatos mp3, flac, ogg, wav y extensiones de listas de reproducción tanto de archivos locales como de archivos remotos. La aplicación puede funcionar completamente fuera de línea por lo que no recolecta información privada y así puedes tener lo mejor de escuchar música con calidad de forma libre, segura y fluida aunque el navegador no esté en primer plano y pudiendo usar los controles multimedia como en otras aplicaciones populares de reproducción multimedia.

## Características principales
- Reproductor de música que puede leer archivos de audio y listas de reproducción desde el directorio del usuario y reproducirlos en segundo plano. Funciona sin conexión y no recolecta información privada.
- Instalación como PWA y funcionamiento completamente offline (excepto para buscar actualizaciones y mostrar notificación cuando exista una nueva versión).
- Ecualizador y potenciador de volumen (placeholder).
- Visualización de carátulas de álbumes y listas de reproducción (placeholder).
- Modo de depuración para desarrollo.
- Controles multimedia del sistema (placeholder).
- Modo de pantalla completa para carátulas y listas (placeholder).
- Visualización de letras de canciones si hay archivos de lyrics disponibles (placeholder).
- Playlist de favoritos generada en el directorio del usuario (placeholder).
- Búsqueda y filtrado por género, año, artista y álbum (placeholder).

## Público objetivo
La aplicación es para melómanos que tienen sus propios archivos de música y no quieren usar reproductores de mala calidad que recogen información del usuario y muestran comerciales, solo la clásica reproducción fluida y sin límites como lo hicieron las mejores aplicaciones en los años 90, ahora admitiendo los formatos actuales, tecnología moderna y dispositivos móviles.

## Instalación y uso

```sh
# Clona el repositorio
https://github.com/juantomoo/PWA-MusicPlayer
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
1. Ejecuta `npm run build` y luego `npm run preview`.
2. Abre la app en tu navegador y accede a las DevTools > Application > Service Workers para verificar el registro.
3. Instala la app desde el navegador (icono de instalación PWA).
4. Prueba la funcionalidad offline recargando la app sin conexión.

## Estructura de carpetas
- `/public`: Assets estáticos, manifest.webmanifest, íconos PWA.
- `/src/assets`: Imágenes y fuentes procesadas por Vite.
- `/src/components`: Componentes Vue reutilizables (incluye DevTools y DeviceFeatures).
- `/src/views`: Vistas principales (HomeView).
- `/src/router`: Configuración de rutas (Vue Router).
- `/src/utils`: Funciones de utilidad (ejemplo: permissions.js para speakers/audio).
- `/src/services`: Lógica de PWA (si se requiere).

## Permisos del dispositivo
- **Speakers**: Se incluye un ejemplo de reproducción de audio local. No se solicitan otros permisos.

## Licencia
MIT

---
Desarrollado por HISQUE Estudio (<explora@hisque.com.co>)
