#!/usr/bin/env python3
"""Local test server: serves the repo root with permissive CORS. Usage: python3 widgets/fixtures/serve.py [port]"""
import http.server, sys, os
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*'); super().end_headers()
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1]) if len(sys.argv) > 1 else 8099), H).serve_forever()
