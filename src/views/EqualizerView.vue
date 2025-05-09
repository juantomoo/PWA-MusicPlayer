<template>
  <div class="equalizer-view">
    <h2>Ecualizador</h2>
    <div class="eq-controls-panel">
      <!-- Slider de volumen booster -->
      <div class="volume-booster">
        <label>Volume Boost</label>
        <input type="range" min="1" max="4" step="0.1" v-model.number="boostGain" @input="onBoostChange" />
      </div>
      <!-- Bass Boost y Clarity toggles -->
      <button @click="applyBassBoost">Bass Boost</button>
      <button @click="applyClarity">Clarity Boost</button>
      <!-- Normalizer toggle -->
      <button @click="toggleNormalizer">
        {{ normalizerOn ? 'Disable Normalizer' : 'Enable Normalizer' }}
      </button>
    </div>
    <div class="eq-sliders">
      <div v-for="(band, i) in eqBands" :key="i" class="eq-band">
        <input type="range" min="-12" max="12" step="0.1"
               v-model.number="band.gain"
               @input="onBandChange(i, band.gain)" />
        <span>{{ band.frequency }}Hz: {{ band.gain }}dB</span>
      </div>
    </div>
    <div class="eq-presets">
      <h3>Presets</h3>
      <button v-for="p in presets" :key="p.name" @click="applyPreset(p)">
        {{ p.name }}
      </button>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted } from 'vue';
import playerStore from '../store/playerStore';
import audioManager from '../utils/audioManager';

export default {
  name: 'EqualizerView',
  setup() {
    const eqBands = computed(() => playerStore.state.equalizer.bands);
    const presets = [
      { name: 'Plano', values: [0, 0, 0, 0, 0] },
      { name: 'Rock',  values: [4, 2, 0, -1, 3] },
      { name: 'Pop',   values: [0, -1, 3, 2, 0] },
      { name: 'Jazz',  values: [3, 1, -1, 1, 3] },
      { name: 'Classical', values: [2, 0, 0, 0, 2] }
    ];
    const boostGain = ref(1);
    const normalizerOn = ref(false);

    function onBandChange(idx, gain) {
      playerStore.setEqualizerBand(idx, gain);
      audioManager.updateEqualizerBand(idx, gain);
    }
    function applyPreset(preset) {
      preset.values.forEach((v, i) => onBandChange(i, v));
    }
    function applyBassBoost() {
      onBandChange(0, 6);
    }
    function applyClarity() {
      onBandChange(eqBands.value.length - 1, 6);
    }
    function onBoostChange() {
      audioManager.setBoost(boostGain.value);
    }
    function toggleNormalizer() {
      normalizerOn.value = !normalizerOn.value;
      if (normalizerOn.value) audioManager.enableNormalizer();
      else audioManager.disableNormalizer();
    }

    onMounted(() => {
      audioManager.initialize();
      audioManager.setupEqualizer();
      audioManager.setBoost(boostGain.value);
    });

    return { eqBands, presets, boostGain, normalizerOn,
             onBandChange, applyPreset, applyBassBoost, applyClarity,
             onBoostChange, toggleNormalizer };
  }
};
</script>

<style scoped>
.equalizer-view { padding: 1rem; }
.eq-controls-panel { display:flex; gap:1rem; margin-bottom:1rem; }
.eq-sliders { display:flex; gap:1rem; }
.eq-band { display:flex; flex-direction:column; align-items:center; }
.eq-presets { margin-top:1rem; }
.volume-booster { display:flex; flex-direction:column; }
</style>
