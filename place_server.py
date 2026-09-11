#!/usr/bin/env python3
"""
Tiny helper server for the animal placement tool.

- Serves the game folder in your browser
- Auto-saves placements into animal-placements.json in this folder

Run:
  python3 place_server.py

Then open:
  http://127.0.0.1:8765/place-animals.html
"""

from __future__ import annotations

import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SAVE_FILE = ROOT / "animal-placements.json"
PORT = 8765


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, format, *args):
        # keep the terminal quiet; only print saves
        if self.path.startswith("/api/"):
            print(format % args)

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        if "animal-placements.json" in self.path:
            self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_POST(self):
        if self.path.rstrip("/") != "/api/save-placements":
            self.send_error(404, "Unknown save path")
            return

        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length)

        try:
            data = json.loads(raw.decode("utf-8"))
            if not isinstance(data, dict) or "rooms" not in data:
                raise ValueError("JSON must include a rooms section")
            SAVE_FILE.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
        except Exception as err:
            msg = str(err).encode("utf-8")
            self.send_response(400)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(msg)))
            self.end_headers()
            self.wfile.write(msg)
            return

        print("Saved", SAVE_FILE.name)
        body = b'{"ok":true}'
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    url = f"http://127.0.0.1:{PORT}/place-animals.html"
    print("Animal placement server is running.")
    print("Open:", url)
    print("Saves to:", SAVE_FILE)
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
