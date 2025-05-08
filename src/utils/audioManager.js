// Lógica de control de audio global
let audio = null;

function playFile(fileHandle, volume = 0.7) {
  if (audio) {
    audio.pause();
    audio = null;
  }
  fileHandle.getFile().then(file => {
    const url = URL.createObjectURL(file);
    audio = new Audio(url);
    audio.volume = volume;
    audio.play();
    audio.onended = () => {
      // Aquí podrías avanzar a la siguiente pista automáticamente
    };
  });
}

function pause() {
  if (audio) audio.pause();
}

function setVolume(val) {
  if (audio) audio.volume = val;
}

export default {
  playFile,
  pause,
  setVolume,
};
