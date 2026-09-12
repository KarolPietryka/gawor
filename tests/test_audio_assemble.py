import tempfile
import unittest
import wave
from pathlib import Path

from src.audio.assemble import assemble


class AudioAssemblyTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)

    def clip(self, identifier, samples, rate=100, width=1):
        with wave.open(str(self.root / f"{identifier}.wav"), "wb") as writer:
            writer.setparams((1, width, rate, 0, "NONE", "not compressed"))
            writer.writeframes(samples)

    def test_order_embedded_silence_last_pause_and_multiple_cycles(self):
        self.clip("01", b"\x90" * 100)
        self.clip("02", b"\xa0" * 200)
        result = assemble([{"id":"01", "de":"Eins."}, {"id":"02", "de":"Zwei."}],
                          self.root, self.root / "set.wav", repeats=2)
        with wave.open(str(self.root / "set.wav"), "rb") as reader:
            actual = reader.readframes(reader.getnframes())
        cycle = b"\x90" * 100 + b"\x80" * 250 + b"\xa0" * 200 + b"\x80" * 400
        self.assertEqual(actual, cycle * 2)
        self.assertEqual(result["duration"], 19)
        self.assertEqual(result["timeline"][2]["start"], 9.5)
        self.assertEqual(result["timeline"][-1]["end"], 19)

    def test_sixteen_bit_silence_is_zero(self):
        self.clip("01", b"\x01\x02" * 100, width=2)
        assemble([{"id":"01", "de":"Eins."}], self.root, self.root / "set.wav")
        with wave.open(str(self.root / "set.wav"), "rb") as reader:
            reader.setpos(100)
            self.assertEqual(reader.readframes(250), b"\x00" * 500)

    def test_rejects_different_sample_rates_without_output(self):
        self.clip("01", b"\x90" * 100)
        self.clip("02", b"\x90" * 100, rate=200)
        with self.assertRaisesRegex(ValueError, "same PCM"):
            assemble([{"id":"01", "de":"Eins."}, {"id":"02", "de":"Zwei."}], self.root, self.root / "set.wav")
        self.assertFalse((self.root / "set.wav").exists())

    def test_rejects_empty_set_and_invalid_pauses(self):
        for kwargs in ({}, {"pause_factor": float("nan")}, {"repeats": 0}):
            with self.assertRaises(ValueError):
                assemble([], self.root, self.root / "set.wav", **kwargs)
        self.clip("01", b"\x90" * 100)
        for kwargs in ({"pause_factor": float("nan")}, {"pause_extra": -1}, {"repeats": 0}):
            with self.assertRaises(ValueError):
                assemble([{"id":"01", "de":"Eins."}], self.root, self.root / "set.wav", **kwargs)

    def test_rejects_path_traversal(self):
        with self.assertRaises(ValueError):
            assemble([{"id":"../outside", "de":"Eins."}], self.root, self.root / "set.wav")


if __name__ == "__main__":
    unittest.main()
