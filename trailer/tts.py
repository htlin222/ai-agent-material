"""Minimal espeak-ng text-to-speech through the bundled library (pip install espeakng-loader).
speak(text, speed, pitch) -> (float32 mono samples, sample_rate). Used by vo.py when the espeak-ng binary is absent."""
import ctypes, shutil, subprocess, tempfile, os
import numpy as np

def _lib():
    import espeakng_loader as e
    lib = ctypes.cdll.LoadLibrary(e.get_library_path())
    data = os.path.dirname(e.get_data_path())
    return lib, data

_STATE = {}

def speak(text, speed=128, pitch=28, voice="en-us+m3"):
    if shutil.which("espeak-ng"):
        import soundfile as sf
        with tempfile.TemporaryDirectory() as d:
            f = os.path.join(d, "v.wav")
            subprocess.run(["espeak-ng", "-v", voice, "-s", str(speed), "-p", str(pitch), "-g", "2", "-w", f, text], check=True)
            x, sr = sf.read(f, dtype="float32")
        return (x.mean(1) if x.ndim > 1 else x), sr
    if "lib" not in _STATE:
        lib, data = _lib()
        CB = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.POINTER(ctypes.c_short), ctypes.c_int, ctypes.c_void_p)
        buf = []
        def cb(wav, n, events):
            if n > 0:
                buf.append(np.ctypeslib.as_array(wav, shape=(n,)).copy())
            return 0
        cbf = CB(cb)
        sr = lib.espeak_Initialize(1, 0, data.encode(), 0)       # AUDIO_OUTPUT_RETRIEVAL
        lib.espeak_SetSynthCallback(cbf)
        _STATE.update(lib=lib, sr=sr, buf=buf, cbf=cbf)
    lib, buf = _STATE["lib"], _STATE["buf"]
    buf.clear()
    lib.espeak_SetVoiceByName(voice.encode())
    lib.espeak_SetParameter(1, speed, 0)    # rate
    lib.espeak_SetParameter(3, pitch, 0)    # pitch
    lib.espeak_SetParameter(7, 2, 0)        # word gap
    t = text.encode() + b"\0"
    lib.espeak_Synth(ctypes.c_char_p(t), ctypes.c_size_t(len(t)), 0, 1, 0, 0, None, None)
    lib.espeak_Synchronize()
    x = np.concatenate(buf).astype(np.float32) / 32768 if buf else np.zeros(1, np.float32)
    return x, _STATE["sr"]

if __name__ == "__main__":
    import soundfile as sf
    x, sr = speak("What does not expire")
    sf.write("/tmp/claude-0/-home-claude/e14b37fa-921a-563c-b20a-6b30e08e16b6/scratchpad/tts.wav", x, sr)
    print(len(x) / sr, "s at", sr)
