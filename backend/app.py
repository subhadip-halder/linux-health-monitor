
from flask import Flask, jsonify, redirect, send_from_directory
import subprocess
import os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS_DIR = os.path.join(BASE_DIR, "scripts")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

app = Flask(__name__)

SCRIPTS = {
    "cpu": "cpu_monitor.sh",
    "memory": "memory_monitor.sh",
    "disk": "disk_monitor.sh",
    "network": "network_monitor.sh",
    "process": "process_monitor.sh",
    "system": "system_monitor.sh"
}

def run_script(script_name):
    path = os.path.join(SCRIPTS_DIR, script_name)

    try:
        result = subprocess.run(
            ["bash", path],
            capture_output=True,
            text=True,
            timeout=15
        )

        if result.returncode != 0:
            return {"output": result.stderr or "Script failed"}

        return {"output": result.stdout.strip()}

    except Exception as e:
        return {"output": str(e)}

@app.route("/")
def home():
    return redirect("/dashboard")

@app.route("/dashboard")
def dashboard():
    return send_from_directory(FRONTEND_DIR, "index.html")

@app.route("/<path:filename>")
def frontend_files(filename):
    return send_from_directory(FRONTEND_DIR, filename)

@app.route("/api/monitor")
def monitor():
    data = {}

    for key, script in SCRIPTS.items():
        data[key] = run_script(script)

    return jsonify({
        "status": "success",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "metrics": data
    })

if __name__ == "__main__":
    print("Linux Health Monitoring System Started!", flush=True)
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")), debug=False)
