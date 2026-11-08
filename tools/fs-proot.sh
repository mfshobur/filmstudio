#!/data/data/com.termux/files/usr/bin/bash
# Run filmstudio inside proot Ubuntu (Android/Termux). usage: fs-proot.sh <project-dir> <command> [args...]
# Optional env inside the container: FILMSTUDIO_PYTHON, FILMSTUDIO_KOKORO_MODEL, FILMSTUDIO_KOKORO_VOICES (defaults below match the original phone setup).
DIR=$(cd "$1" && pwd); shift
ENVS="export FILMSTUDIO_PYTHON=\${FILMSTUDIO_PYTHON:-/root/kvenv/bin/python} FILMSTUDIO_KOKORO_MODEL=\${FILMSTUDIO_KOKORO_MODEL:-/data/data/com.termux/files/home/kokoro/kokoro-v1.0.onnx} FILMSTUDIO_KOKORO_VOICES=\${FILMSTUDIO_KOKORO_VOICES:-/data/data/com.termux/files/home/kokoro/voices-v1.0.bin}"
exec proot-distro login ubuntu --shared-tmp -- bash -lc "$ENVS; cd '$DIR' && node /data/data/com.termux/files/home/filmstudio/bin/filmstudio.js $*"
