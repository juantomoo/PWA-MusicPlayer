// utils/permissions.js
// Solo speakers está habilitado, así que solo ejemplo de reproducción de audio
export function playSampleAudio() {
  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio('/sample.mp3');
      audio.oncanplaythrough = () => {
        audio.play();
        resolve('Audio reproduciéndose');
      };
      audio.onerror = () => reject('No se pudo reproducir el audio');
    } catch (e) {
      reject(e);
    }
  });
}
