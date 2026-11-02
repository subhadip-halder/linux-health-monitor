const refreshButton = document.getElementById("refresh");
const statusPill = document.getElementById("status");
const toast = document.getElementById("toast");
let requestInProgress = false;
let toastTimer;

function setStatus(label, state) {
  statusPill.className = `status-pill ${state || ""}`;
  statusPill.querySelector("span").textContent = label;
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 5000);
}

function metricValue(id, value, label, percent) {
  document.getElementById(`${id}-value`).innerHTML = `${value}<small>%</small>`;
  document.getElementById(`${id}-label`).textContent = label;
  const meter = document.getElementById(`${id}-meter`);
  meter.style.width = `${Math.max(0, Math.min(100, percent))}%`;
}

function parsePercent(text, expression) {
  const match = text.match(expression);
  return match ? Number.parseFloat(match[1]) : null;
}

function renderMetrics(metrics) {
  const cpu = metrics.cpu?.output || "";
  const cpuUsage = parsePercent(cpu, /CPU Usage:\s*([\d.]+)%/i);
  metricValue("cpu", cpuUsage === null ? "—" : cpuUsage.toFixed(1), cpuUsage === null ? "Usage unavailable" : "Current utilization", cpuUsage || 0);

  const memory = metrics.memory?.output || "";
  const memoryUsage = parsePercent(memory, /RAM Usage\s*:\s*([\d.]+)%/i);
  const used = memory.match(/Used RAM\s*:\s*(.+)/i)?.[1]?.trim();
  const total = memory.match(/Total RAM\s*:\s*(.+)/i)?.[1]?.trim();
  metricValue("memory", memoryUsage === null ? "—" : memoryUsage.toFixed(1), used && total ? `${used} of ${total}` : "Usage unavailable", memoryUsage || 0);

  const disk = metrics.disk?.output || "";
  const diskPercents = [...disk.matchAll(/\s(\d{1,3})%\s+\//g)].map((match) => Number(match[1]));
  const diskUsage = diskPercents.length ? Math.max(...diskPercents) : null;
  const diskCount = (disk.match(/^\/\S+/gm) || []).length;
  metricValue("disk", diskUsage === null ? "—" : String(diskUsage), diskUsage === null ? "Usage unavailable" : `${diskCount} filesystem${diskCount === 1 ? "" : "s"} · highest usage`, diskUsage || 0);

  const network = metrics.network?.output || "";
  const interfaceLines = network.split("\n").filter((line) => /^\S+\s+(UP|DOWN|UNKNOWN)\s+/i.test(line) && !/^lo\s/i.test(line));
  document.getElementById("network-value").textContent = String(interfaceLines.length);
  document.getElementById("network-label").textContent = interfaceLines.map((line) => line.trim().split(/\s+/)[0]).join(", ") || "No active interfaces reported";
}

function renderSystem(output) {
  const details = output.split("\n").map((line) => {
    const match = line.match(/^([^:]+):\s*(.*)$/);
    return match ? [match[1].trim(), match[2].trim()] : null;
  }).filter(Boolean);
  const list = document.getElementById("system");
  list.replaceChildren();
  if (!details.length) {
    list.innerHTML = '<div class="empty-state">System information is unavailable.</div>';
    return;
  }
  for (const [label, value] of details) {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value || "—";
    if (["Kernel", "Architecture"].includes(label)) description.className = "mono";
    row.append(term, description);
    list.append(row);
  }
}

function renderProcesses(output) {
  const lines = output.split("\n");
  const start = lines.findIndex((line) => /^USER\s+PID\s+%CPU\s+%MEM/i.test(line.trim()));
  const totalIndex = lines.findIndex((line) => /Total Running Processes/i.test(line));
  const total = totalIndex >= 0 ? Number.parseInt(lines[totalIndex + 1], 10) : NaN;
  document.getElementById("process-count").textContent = Number.isFinite(total) ? `${total} processes` : "Process count unavailable";
  const rows = start >= 0 ? lines.slice(start + 1).filter((line) => /^\S+\s+\d+\s/.test(line)).slice(0, 10) : [];
  const body = document.getElementById("process");
  body.replaceChildren();
  if (!rows.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="4" class="empty-state">Process information is unavailable.</td>';
    body.append(row);
    return;
  }
  for (const line of rows) {
    const fields = line.trim().split(/\s+/);
    const row = document.createElement("tr");
    const values = [fields[0], fields.slice(10).join(" ") || "—", `${fields[2]}%`, `${fields[3]}%`];
    values.forEach((value, index) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      if (index === 1) cell.className = "process-name";
      row.append(cell);
    });
    body.append(row);
  }
}

async function loadData() {
  if (requestInProgress) return;
  requestInProgress = true;
  refreshButton.disabled = true;
  refreshButton.innerHTML = '<span aria-hidden="true">↻</span> Updating';
  setStatus("Updating", "loading");
  try {
    const response = await fetch("/api/monitor", { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!response.ok) throw new Error(`Monitoring API returned ${response.status}`);
    const data = await response.json();
    if (!data.metrics || data.status !== "success") throw new Error("Monitoring API returned an incomplete response");
    renderMetrics(data.metrics);
    renderSystem(data.metrics.system?.output || "");
    renderProcesses(data.metrics.process?.output || "");
    setStatus("System connected", "online");
    const timestamp = data.timestamp ? new Date(data.timestamp.replace(" ", "T")) : new Date();
    document.getElementById("updated").textContent = Number.isNaN(timestamp.getTime()) ? new Date().toLocaleTimeString() : timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    toast.hidden = true;
  } catch (error) {
    console.error("Unable to load system metrics:", error);
    setStatus("Backend disconnected", "offline");
    showToast("Could not reach the monitoring service. Check that the backend is running, then refresh.");
  } finally {
    requestInProgress = false;
    refreshButton.disabled = false;
    refreshButton.innerHTML = '<span aria-hidden="true">↻</span> Refresh';
  }
}

refreshButton.addEventListener("click", loadData);
loadData();
window.setInterval(loadData, 10000);
