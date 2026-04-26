import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Records mic audio with MediaRecorder, decodes the resulting blob with
 * AudioContext, and re-encodes to WAV (16-bit PCM mono) before returning.
 *
 * Why WAV: Gemini's inline audio mime list is wav/mp3/aiff/aac/ogg/flac.
 * Chrome's MediaRecorder default is webm, which Gemini does not accept inline.
 *
 * Returns:
 *   { state, level, seconds, start, stop, reset, blob, base64 }
 *   state: 'idle' | 'recording' | 'processing' | 'ready' | 'error'
 *   level: 0..1 — instantaneous mic level for visualization
 */
export function useVoiceRecorder({ maxSeconds = 30 } = {}) {
  const [state, setState] = useState('idle');
  const [level, setLevel] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState(null);
  const [base64, setBase64] = useState(null);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const tickRef = useRef(null);
  const startedAtRef = useRef(0);

  const teardown = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch { /* ignore */ }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    rafRef.current = null;
    tickRef.current = null;
  }, []);

  useEffect(() => () => teardown(), [teardown]);

  const reset = useCallback(() => {
    teardown();
    setState('idle');
    setLevel(0);
    setSeconds(0);
    setBlob(null);
    setBase64(null);
    setError(null);
    chunksRef.current = [];
  }, [teardown]);

  const start = useCallback(async () => {
    setError(null);
    setBlob(null);
    setBase64(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Mic-level meter via Web Audio API
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const meter = () => {
        if (!analyserRef.current) return;
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (let i = 0; i < data.length; i++) {
          const v = Math.abs(data[i] - 128) / 128;
          if (v > peak) peak = v;
        }
        setLevel(peak);
        rafRef.current = requestAnimationFrame(meter);
      };
      rafRef.current = requestAnimationFrame(meter);

      // MediaRecorder for the actual capture; we'll re-encode to WAV on stop.
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        try {
          setState('processing');
          const recorded = new Blob(chunksRef.current, {
            type: mr.mimeType || 'audio/webm',
          });
          const wavBlob = await blobToWav(recorded);
          const b64 = await blobToBase64(wavBlob);
          setBlob(wavBlob);
          setBase64(b64);
          setState('ready');
        } catch (err) {
          setError(err.message || 'Failed to process audio');
          setState('error');
        } finally {
          // Stop the mic but keep refs so caller can read level=0
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
          }
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          if (tickRef.current) clearInterval(tickRef.current);
          rafRef.current = null;
          tickRef.current = null;
          setLevel(0);
        }
      };

      startedAtRef.current = performance.now();
      tickRef.current = setInterval(() => {
        const elapsed = (performance.now() - startedAtRef.current) / 1000;
        setSeconds(elapsed);
        if (elapsed >= maxSeconds && mr.state === 'recording') {
          mr.stop();
        }
      }, 200);

      mr.start();
      setState('recording');
    } catch (err) {
      setError(err.message || 'Microphone access denied');
      setState('error');
      teardown();
    }
  }, [maxSeconds, teardown]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  return { state, level, seconds, error, start, stop, reset, blob, base64 };
}

/* ── helpers ── */

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const result = String(fr.result || '');
      const idx = result.indexOf(',');
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    fr.onerror = () => reject(fr.error || new Error('FileReader failed'));
    fr.readAsDataURL(blob);
  });
}

async function blobToWav(blob) {
  const arrayBuf = await blob.arrayBuffer();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx();
  const audioBuffer = await ctx.decodeAudioData(arrayBuf.slice(0));
  ctx.close();

  // Downmix to mono
  const numCh = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const mono = new Float32Array(length);
  for (let ch = 0; ch < numCh; ch++) {
    const data = audioBuffer.getChannelData(ch);
    for (let i = 0; i < length; i++) mono[i] += data[i] / numCh;
  }

  return encodeWav(mono, audioBuffer.sampleRate);
}

function encodeWav(samples, sampleRate) {
  const numChannels = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataLength = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
