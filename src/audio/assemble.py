"""Join PCM WAV speech clips with embedded silence, using bounded memory.

Only the standard library is required. Silence is audio data, not a UI timer.
Input clips must have the same PCM format. Each manifest entry has id and de.
"""

import argparse
import json
import math
from pathlib import Path
import tempfile
import wave


def assemble(sentences, clip_dir, output, *, pause_factor=1.5, pause_extra=1.0, repeats=1):
    if not sentences:
        raise ValueError("A practice set must contain at least one sentence")
    if not math.isfinite(pause_factor) or not math.isfinite(pause_extra) or pause_factor < 0 or pause_extra < 0:
        raise ValueError("Pause parameters must be finite and nonnegative")
    if not isinstance(repeats, int) or repeats < 1:
        raise ValueError("Repeats must be a positive integer")
    clip_dir, output = Path(clip_dir), Path(output)
    clips, common, seen = [], None, set()
    for sentence in sentences:
        identifier = sentence["id"]
        if not isinstance(identifier, str) or not identifier.isalnum() or identifier in seen:
            raise ValueError("Sentence IDs must be unique alphanumeric strings")
        if not isinstance(sentence.get("de"), str) or not sentence["de"].strip():
            raise ValueError("Each sentence needs German text")
        seen.add(identifier)
        path = clip_dir / f"{identifier}.wav"
        if path.resolve() == output.resolve():
            raise ValueError("Output must not overwrite an input clip")
        with wave.open(str(path), "rb") as reader:
            fmt = (reader.getnchannels(), reader.getsampwidth(), reader.getframerate())
            frames = reader.getnframes()
            if reader.getcomptype() != "NONE" or frames == 0:
                raise ValueError(f"{identifier}: expected nonempty PCM WAV")
            if common is not None and fmt != common:
                raise ValueError("All clips must use the same PCM format")
            common = fmt
        pause_frames = round(frames * pause_factor + pause_extra * common[2])
        clips.append((sentence, path, frames, pause_frames))
    channels, width, rate = common
    total_frames = sum(frames + pause for _, _, frames, pause in clips) * repeats
    if total_frames * channels * width > 0xFFFFFFFF - 36:
        raise ValueError("Output exceeds the WAV size limit; use compressed audio for long sessions")
    output.parent.mkdir(parents=True, exist_ok=True)
    # Write atomically: failed input reads must not leave a partial final asset.
    with tempfile.NamedTemporaryFile(dir=output.parent, suffix=".wav", delete=False) as temporary:
        temporary_path = Path(temporary.name)
    timeline, cursor = [], 0
    silence_sample = b"\x80" if width == 1 else b"\x00" * width
    try:
        with wave.open(str(temporary_path), "wb") as writer:
            writer.setparams((channels, width, rate, 0, "NONE", "not compressed"))
            for cycle in range(repeats):
                for sentence, path, frames, pause_frames in clips:
                    timeline.append({**sentence, "cycle": cycle + 1, "start": cursor / rate,
                                     "speech_end": (cursor + frames) / rate,
                                     "end": (cursor + frames + pause_frames) / rate})
                    with wave.open(str(path), "rb") as reader:
                        copied = 0
                        while data := reader.readframes(8192):
                            copied += len(data)
                            writer.writeframesraw(data)
                        if copied != frames * channels * width:
                            raise ValueError(f"{sentence['id']}: truncated WAV input")
                    remaining = pause_frames
                    while remaining:
                        count = min(remaining, 8192)
                        writer.writeframesraw(silence_sample * channels * count)
                        remaining -= count
                    cursor += frames + pause_frames
        temporary_path.replace(output)
    finally:
        temporary_path.unlink(missing_ok=True)
    return {"file": output.name, "duration": total_frames / rate, "repeats": repeats,
            "pause_factor": pause_factor, "pause_extra": pause_extra, "timeline": timeline}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("sentences", type=Path)
    parser.add_argument("clip_dir", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--repeats", type=int, default=1)
    parser.add_argument("--pause-factor", type=float, default=1.5)
    parser.add_argument("--pause-extra", type=float, default=1.0)
    args = parser.parse_args()
    result = assemble(json.loads(args.sentences.read_text(encoding="utf-8-sig")), args.clip_dir,
                      args.output, pause_factor=args.pause_factor, pause_extra=args.pause_extra,
                      repeats=args.repeats)
    args.output.with_suffix(".json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Created {result['duration']:.1f} seconds of audio ({result['repeats']} cycles)")


if __name__ == "__main__":
    main()
