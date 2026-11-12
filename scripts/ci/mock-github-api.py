#!/usr/bin/env python3
"""Tiny mock of the GitHub Actions REST API for github-dispatch-selftest.sh.

Implements only the endpoints scripts/ci/github-dispatch.sh needs. Binds an
ephemeral port on 127.0.0.1 and writes it to --port-file so the caller can
build GH_API_BASE.

Scenarios:
  success    run goes queued -> in_progress -> completed(success) in <1s, serves
             one artifact through a redirect
  failure    run is completed(failure) from the first poll, serves a job log
  stuck      run stays queued forever (drives the queue timeout / cancel path)
  cancelled  run is completed(cancelled) from the first poll (external cancel)
  startup_failure
             run is completed(startup_failure) from the first poll — GitHub
             never booted the run (zero jobs, no logs)
"""

import argparse
import io
import json
import time
import zipfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

SCENARIOS = ("success", "failure", "stuck", "cancelled", "startup_failure")
RUN_ID = 123
REPO = "/repos/owner/repo"
WORKFLOW = "/actions/workflows/ci.yml"
ARTIFACT_NAME = "unsigned-apk"
SELFTEST_SHA = "0123456789abcdef0123456789abcdef01234567"
WRONG_SHA = "f" * 40
STATE = {}


def run_state():
    scenario = STATE["scenario"]
    if scenario == "stuck":
        return "queued", None
    if scenario == "failure":
        return "completed", "failure"
    if scenario == "cancelled":
        return "completed", "cancelled"
    if scenario == "startup_failure":
        return "completed", "startup_failure"
    elapsed = time.monotonic() - STATE["dispatch_time"]
    if elapsed < 0.3:
        return "queued", None
    if elapsed < 0.6:
        return "in_progress", None
    return "completed", "success"


def artifact_zip():
    """A real zip archive, as GitHub artifact downloads are."""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("app-prod-release-unsigned.apk", "tiny apk payload\n")
    return buffer.getvalue()


class Handler(BaseHTTPRequestHandler):
    server_version = "MockGitHubAPI/1.0"

    def log_message(self, *args):  # keep the self-test output clean
        pass

    def send_json(self, status, payload=None, headers=None):
        body = b"" if payload is None else json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        for key, value in (headers or {}).items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(body)

    def send_bytes(self, status, body, content_type="application/octet-stream"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def run_payload(self):
        status, conclusion = run_state()
        return {
            "id": RUN_ID,
            "status": status,
            "conclusion": conclusion,
            "head_sha": WRONG_SHA if STATE["wrong_sha"] else STATE["sha"],
            "html_url": f"{STATE['base_url']}/runs/{RUN_ID}",
        }

    def do_GET(self):
        if STATE["request_log"]:
            with open(STATE["request_log"], "a", encoding="utf-8") as handle:
                handle.write(f"GET {self.path}\n")
        path = self.path.split("?", 1)[0]

        if path.startswith(f"{REPO}/commits/"):
            if STATE["mirror_401"]:
                self.send_json(401, {"message": "Bad credentials"})
                return
            self.send_json(200, {"sha": path.rsplit("/", 1)[-1]})
            return
        for kind in ("tags", "heads"):
            prefix = f"{REPO}/git/ref/{kind}/"
            if path.startswith(prefix):
                ref = path[len(prefix):]
                self.send_json(200, {
                    "ref": f"refs/{kind}/{ref}",
                    "object": {
                        "sha": WRONG_SHA if STATE["wrong_tag"] else STATE["sha"],
                        "type": "commit",
                    },
                })
                return
        if path == f"{REPO}/actions/runs/{RUN_ID}":
            if STATE["run_503"]:
                self.send_json(503, {"message": "service unavailable"})
                return
            self.send_json(200, self.run_payload())
            return
        if path == f"{REPO}/actions/runs/{RUN_ID}/artifacts":
            self.send_json(200, {
                "artifacts": [{
                    "name": ARTIFACT_NAME,
                    "archive_download_url": f"{STATE['base_url']}/artifacts/{ARTIFACT_NAME}.zip",
                }],
            })
            return
        if path == f"{REPO}/actions/runs/{RUN_ID}/jobs":
            _, conclusion = run_state()
            self.send_json(200, {"jobs": [{"id": 7, "conclusion": conclusion or "success"}]})
            return
        if path == f"{REPO}/actions/jobs/7/logs":
            self.send_bytes(200, b"line 1 of failed job log\nbuild failed\n", "text/plain")
            return
        if path == f"{REPO}{WORKFLOW}/runs":
            self.send_json(200, {"workflow_runs": [self.run_payload()]})
            return
        if path.startswith("/artifacts/"):
            if STATE["artifact_error"]:
                self.send_json(403, {"message": "artifact download forbidden"})
                return
            name = path[len("/artifacts/"):]
            self.send_json(302, None, {"Location": f"/artifact-content/{name}"})
            return
        if path.startswith("/artifact-content/"):
            self.send_bytes(200, artifact_zip(), "application/zip")
            return

        self.send_json(404, {"message": f"no mock route for {path}"})

    def do_POST(self):
        path = self.path.split("?", 1)[0]
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length) if length else b""

        if path == f"{REPO}{WORKFLOW}/dispatches":
            if STATE["dispatch_log"]:
                with open(STATE["dispatch_log"], "w", encoding="utf-8") as handle:
                    handle.write(body.decode("utf-8"))
            STATE["dispatch_count"] += 1
            if STATE["dispatch_503_once"] and STATE["dispatch_count"] == 1:
                self.send_json(503, {"message": "service unavailable"})
                return
            # 200 (not the literal 204 from the spec): a dispatch response must
            # carry {"workflow_run_id": ...}, and HTTP 204 may not have a body.
            STATE["dispatch_time"] = time.monotonic()
            self.send_json(200, {"workflow_run_id": RUN_ID})
            return
        if path == f"{REPO}/actions/runs/{RUN_ID}/cancel":
            with open(STATE["cancel_log"], "a", encoding="utf-8") as handle:
                handle.write(f"POST {path}\n")
            self.send_json(202, {"message": "cancel requested"})
            return

        self.send_json(404, {"message": f"no mock route for {path}"})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--scenario", choices=SCENARIOS, default="success")
    parser.add_argument("--port-file", required=True)
    parser.add_argument("--cancel-log", default="/dev/null")
    parser.add_argument("--dispatch-log", default="")
    parser.add_argument("--request-log", default="")
    parser.add_argument(
        "--dispatch-503-once",
        action="store_true",
        help="fail the first dispatch POST with 503 (retry scenario)",
    )
    parser.add_argument(
        "--run-503",
        action="store_true",
        help="return 503 for the run poll endpoint (API-unreachable scenario)",
    )
    parser.add_argument(
        "--mirror-401",
        action="store_true",
        help="return 401 for the commits endpoint (bad-token scenario)",
    )
    parser.add_argument(
        "--artifact-error",
        action="store_true",
        help="return 403 for artifact downloads (transport-failure scenario)",
    )
    parser.add_argument(
        "--sha",
        default=SELFTEST_SHA,
        help="commit sha the mock tag/ref endpoints resolve to",
    )
    parser.add_argument(
        "--wrong-tag",
        action="store_true",
        help="resolve the tag/ref endpoints to a different commit (moved-tag scenario)",
    )
    parser.add_argument(
        "--wrong-sha",
        action="store_true",
        help="report a different head_sha on the run (stale-run scenario)",
    )
    args = parser.parse_args()

    STATE["scenario"] = args.scenario
    STATE["cancel_log"] = args.cancel_log
    STATE["dispatch_log"] = args.dispatch_log
    STATE["request_log"] = args.request_log
    STATE["dispatch_503_once"] = args.dispatch_503_once
    STATE["dispatch_count"] = 0
    STATE["run_503"] = args.run_503
    STATE["mirror_401"] = args.mirror_401
    STATE["artifact_error"] = args.artifact_error
    STATE["sha"] = args.sha
    STATE["wrong_tag"] = args.wrong_tag
    STATE["wrong_sha"] = args.wrong_sha
    STATE["dispatch_time"] = time.monotonic()

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    STATE["base_url"] = f"http://127.0.0.1:{server.server_address[1]}"
    with open(args.port_file, "w", encoding="utf-8") as handle:
        handle.write(str(server.server_address[1]))

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
