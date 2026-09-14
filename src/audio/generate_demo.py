"""Generate the eight-sentence fixture once; playback needs no TTS service."""
import asyncio
import json
import subprocess
from pathlib import Path

import edge_tts
import imageio_ffmpeg

from assemble import assemble

ROOT = Path(__file__).resolve().parents[2]
VOICE = 'de-DE-KatjaNeural'


async def main():
    sentences = json.loads((ROOT / 'dev/sprint-001/sentences.json').read_text(encoding='utf-8'))
    cache = ROOT / '.audio-cache'
    cache.mkdir(exist_ok=True)
    output = ROOT / 'app/public/audio'
    output.mkdir(parents=True, exist_ok=True)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    for sentence in sentences:
        mp3 = cache / f"{sentence['id']}.mp3"
        wav = cache / f"{sentence['id']}.wav"
        if not mp3.exists() or mp3.stat().st_size == 0:
            await edge_tts.Communicate(sentence['de'], VOICE, rate='-10%').save(str(mp3))
        subprocess.run([ffmpeg, '-v', 'error', '-y', '-i', str(mp3), '-ar', '24000',
                        '-ac', '1', '-c:a', 'pcm_s16le', str(wav)], check=True)
    manifest = assemble(sentences, cache, cache / 'practice.wav')
    subprocess.run([ffmpeg, '-v', 'error', '-y', '-i', str(cache / 'practice.wav'),
                    '-c:a', 'libmp3lame', '-b:a', '96k', str(output / 'practice.mp3')], check=True)
    manifest.update(file='practice.mp3', voice=VOICE, provider='edge-tts (demo fixture)')
    (output / 'practice.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"Generated {len(sentences)} sentences, {manifest['duration']:.1f}s, {(output / 'practice.mp3').stat().st_size} bytes")


if __name__ == '__main__':
    asyncio.run(main())
