const API_URL = "http://localhost:8000";

export async function uploadFloorplan(file) {
  const form = new FormData();
  form.append("file", file);

  const resp = await fetch(`${API_URL}/upload-floorplan`, {
    method: "POST",
    body: form,
  });
  if (!resp.ok) {
    const errJSON = await resp.json().catch(() => ({}));
    throw new Error(errJSON.detail || "Upload failed");
  }
  return resp.json(); 
}

export async function fetchHeatmap(x, y) {
  const resp = await fetch(`${API_URL}/heatmap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ x, y }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || `Heatmap error: ${resp.status}`);
  }
  const blob = await resp.blob();
  return URL.createObjectURL(blob);
}

export async function getBestRouter(sampleCount = 30) {
  const resp = await fetch(
    `${API_URL}/best-router?sample_count=${sampleCount}`,
    { method: "POST" }
  );
  if (!resp.ok) {
    const errJSON = await resp.json().catch(() => ({}));
    throw new Error(errJSON.detail || "Best router failed");
  }
  return resp.json();
}
