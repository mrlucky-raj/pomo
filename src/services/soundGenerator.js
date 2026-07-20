/**
 * Web Audio API Procedural Ambient Sound Generator
 * Works 100% offline without external network or audio files!
 */

class SoundGenerator {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.activeNodes = {};
    this.trackVolumes = {
      rain: 0.5,
      whiteNoise: 0.3,
      waves: 0.5,
      fireplace: 0.4,
      alphaTone: 0.2,
    };
    this.masterVolume = 0.5;
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMasterVolume(val) {
    this.masterVolume = val;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(val, this.ctx.currentTime);
    }
  }

  setTrackVolume(track, val) {
    this.trackVolumes[track] = val;
    if (this.activeNodes[track] && this.activeNodes[track].gainNode) {
      this.activeNodes[track].gainNode.gain.setValueAtTime(val, this.ctx.currentTime);
    }
  }

  // Create White / Pink Noise Buffer
  createNoiseBuffer(type = 'pink') {
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }
    } else if (type === 'brown') {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
    }
    return buffer;
  }

  toggleTrack(track, play) {
    this.initContext();

    if (play) {
      if (this.activeNodes[track]) return; // Already playing

      if (track === 'rain') this.startRain();
      else if (track === 'whiteNoise') this.startWhiteNoise();
      else if (track === 'waves') this.startWaves();
      else if (track === 'fireplace') this.startFireplace();
      else if (track === 'alphaTone') this.startAlphaTone();
    } else {
      if (this.activeNodes[track]) {
        try {
          if (this.activeNodes[track].source) this.activeNodes[track].source.stop();
          if (this.activeNodes[track].osc) this.activeNodes[track].osc.stop();
          if (this.activeNodes[track].lfo) this.activeNodes[track].lfo.stop();
        } catch (e) {
          // ignore
        }
        delete this.activeNodes[track];
      }
    }
  }

  startRain() {
    const buffer = this.createNoiseBuffer('pink');
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(this.trackVolumes.rain, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    source.start();
    this.activeNodes.rain = { source, gainNode };
  }

  startWhiteNoise() {
    const buffer = this.createNoiseBuffer('white');
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(this.trackVolumes.whiteNoise, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    source.start();
    this.activeNodes.whiteNoise = { source, gainNode };
  }

  startWaves() {
    const buffer = this.createNoiseBuffer('brown');
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);

    // LFO for wave modulation
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.1, this.ctx.currentTime); // 10s wave cycles

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(300, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(this.trackVolumes.waves, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    source.start();
    lfo.start();
    this.activeNodes.waves = { source, lfo, gainNode };
  }

  startFireplace() {
    const buffer = this.createNoiseBuffer('pink');
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, this.ctx.currentTime);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(this.trackVolumes.fireplace, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    source.start();
    this.activeNodes.fireplace = { source, gainNode };
  }

  startAlphaTone() {
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(432, this.ctx.currentTime); // 432 Hz focus tone

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(this.trackVolumes.alphaTone, this.ctx.currentTime);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start();
    this.activeNodes.alphaTone = { osc, gainNode };
  }

  // Play audio chime/bell on pomodoro completion
  playCompletionChime() {
    this.initContext();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 chime
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.15);

      gain.gain.setValueAtTime(0, this.ctx.currentTime + idx * 0.15);
      gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + idx * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.15 + 1.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(this.ctx.currentTime + idx * 0.15);
      osc.stop(this.ctx.currentTime + idx * 0.15 + 1.3);
    });
  }

  stopAll() {
    Object.keys(this.activeNodes).forEach(track => this.toggleTrack(track, false));
  }
}

export const soundGen = new SoundGenerator();
