export const AUDIO_PROFILE = {
  model: 'gpt-4o-mini-tts',
  voice: 'nova',
  sampleRate: 24_000,
  pauseMultiplierMilli: 1500,
  profileVersion: 1,
} as const;

export type AudioTimelineItem = {
  start: number;
  speech_end: number;
  end: number;
};

export type AudioManifest = {
  version: 1;
  duration: number;
  sample_rate: number;
  timeline: AudioTimelineItem[];
};

export async function audioContentDigest(sentences: string[]) {
  const profile = JSON.stringify({
    sentences: sentences.map((sentence) =>
      sentence.trim().replace(/\s+/g, ' ').normalize('NFC'),
    ),
    ...AUDIO_PROFILE,
  });
  const bytes = new TextEncoder().encode(profile);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

function wavHeader(dataLength: number) {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const writeText = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index++)
      view.setUint8(offset + index, value.charCodeAt(index));
  };
  writeText(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, AUDIO_PROFILE.sampleRate, true);
  view.setUint32(28, AUDIO_PROFILE.sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, 'data');
  view.setUint32(40, dataLength, true);
  return new Uint8Array(header);
}

/**
 * Joins signed 16-bit mono PCM clips with zero-valued PCM silence.  The
 * returned timeline is derived from the clip lengths, never from text length
 * or API latency.
 */
export function assemblePcm(clips: Uint8Array[]) {
  if (!clips.length) throw new Error('Nie można złożyć pustego zestawu.');
  if (clips.some((clip) => clip.byteLength === 0 || clip.byteLength % 2))
    throw new Error('Synteza zwróciła nieprawidłowy klip PCM.');

  const timeline: AudioTimelineItem[] = [];
  const pauses = clips.map((clip) => {
    const speechFrames = clip.byteLength / 2;
    return Math.round(
      speechFrames * (AUDIO_PROFILE.pauseMultiplierMilli / 1000),
    );
  });
  const dataLength = clips.reduce(
    (total, clip, index) => total + clip.byteLength + pauses[index] * 2,
    0,
  );
  if (dataLength > 0xffffffff - 36)
    throw new Error('Nagranie jest zbyt długie.');

  const wav = new Uint8Array(44 + dataLength);
  wav.set(wavHeader(dataLength));
  let offset = 44;
  let frame = 0;
  for (const [index, clip] of clips.entries()) {
    const speechFrames = clip.byteLength / 2;
    const start = frame / AUDIO_PROFILE.sampleRate;
    wav.set(clip, offset);
    offset += clip.byteLength;
    frame += speechFrames;
    const speech_end = frame / AUDIO_PROFILE.sampleRate;
    // Uint8Array is initialized with zeroes, which is silence for PCM s16le.
    const pauseBytes = pauses[index] * 2;
    offset += pauseBytes;
    frame += pauses[index];
    timeline.push({
      start,
      speech_end,
      end: frame / AUDIO_PROFILE.sampleRate,
    });
  }
  return {
    wav,
    manifest: {
      version: 1 as const,
      duration: frame / AUDIO_PROFILE.sampleRate,
      sample_rate: AUDIO_PROFILE.sampleRate,
      timeline,
    },
  };
}

export function parseManifest(value: string | null): AudioManifest | null {
  if (!value) return null;
  try {
    const manifest = JSON.parse(value) as AudioManifest;
    if (
      manifest.version !== 1 ||
      !Number.isFinite(manifest.duration) ||
      manifest.duration <= 0 ||
      manifest.sample_rate !== AUDIO_PROFILE.sampleRate ||
      !Array.isArray(manifest.timeline) ||
      manifest.timeline.some(
        (item) =>
          ![item.start, item.speech_end, item.end].every(Number.isFinite) ||
          item.start < 0 ||
          item.speech_end <= item.start ||
          item.end <= item.speech_end,
      )
    )
      return null;
    return manifest;
  } catch {
    return null;
  }
}
