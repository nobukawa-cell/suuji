# かずあそび の声を作り直すスクリプト
# 使い方: python make_voices.py   （要: pip install edge-tts）
# 1) voice_script.tsv のセリフを女性の声で mp3 にする → assets/voice/
# 2) mp3 を埋め込んだ voices.js を作り直す
import asyncio, base64, json, pathlib, sys
import edge_tts

HERE = pathlib.Path(__file__).parent
VOICE = "ja-JP-NanamiNeural"   # 女性の声
# ゆっくりめ＝やさしく聞こえる。高さを大きく上げると機械っぽくなるので少しだけ。
RATE, PITCH = "-5%", "+5Hz"

def load_script():
    rows = []
    for line in (HERE / "voice_script.tsv").read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        key, text = line.split("\t", 1)
        rows.append((key.strip(), text.strip()))
    return rows

async def make(key, text, out):
    await edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH).save(str(out))

async def main(only):
    vdir = HERE / "assets" / "voice"
    vdir.mkdir(parents=True, exist_ok=True)
    rows = load_script()
    for key, text in rows:
        if only and key not in only:
            continue
        await make(key, text, vdir / f"{key}.mp3")
        print("ok", key, text)
    data = {k: base64.b64encode((vdir / f"{k}.mp3").read_bytes()).decode() for k, _ in rows}
    js = ("// 録音した声（mp3をそのまま埋め込み）。Web Audio で先に展開しておき、押した瞬間に鳴らすため。\n"
          "// 中身は assets/voice/*.mp3 と同じ。音声を足したら作り直すこと（make_voices.py）。\n"
          "window.VOICEDATA=" + json.dumps(data, separators=(",", ":")) + ";\n")
    (HERE / "voices.js").write_text(js, encoding="utf-8")
    print("voices.js", len(data), "voices")

asyncio.run(main(set(sys.argv[1:])))
