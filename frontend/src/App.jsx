import React, { useState, useRef } from "react";
import { uploadFloorplan, fetchHeatmap, getBestRouter } from "./api";
import FloorplanCanvas from "./FloorplanCanvas";

export default function App() {
  const fileInputRef = useRef(null);
  const [imageB64, setImageB64] = useState(null);
  const [dims, setDims] = useState(null);
  const [heatmapUrl, setHeatmapUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bestPoint, setBestPoint] = useState(null);

  const handleUploadFloorplan = async () => {
    const file = fileInputRef.current.files[0];
    if (!file) {
      alert("Please choose a file first.");
      return;
    }
    try {
      const { image_b64, resized_shape } = await uploadFloorplan(file);
      setImageB64(image_b64);
      setDims(resized_shape);
      setHeatmapUrl(null);
      setBestPoint(null);
    } catch (err) {
      alert("Upload failed:\n" + err.message);
    }
  };

  const handleCanvasClick = async (x, y) => {
    if (!dims || loading) return;
    try {
      const url = await fetchHeatmap(x, y);
      setHeatmapUrl(url);
      setBestPoint([y, x]); 
    } catch (err) {
      alert("Heatmap request failed:\n" + err.message);
    }
  };

  const handleFindBest = async () => {
    if (!dims) return;
    setLoading(true);
    try {
      const data = await getBestRouter(50);
      const { best_point } = data;
      const r = best_point.row;
      const c = best_point.col;
      const url = await fetchHeatmap(c, r);
      setHeatmapUrl(url);
      setBestPoint([r, c]); 
    } catch (err) {
      alert("Best Router failed:\n" + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setHeatmapUrl(null);
    setBestPoint(null);
  };

  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <h2>Wi-Fi Router Optimizer</h2>

      <div style={{ marginTop: 20 }}>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ marginBottom: 10 }}
        />
        <br />
        <button onClick={handleUploadFloorplan}>Upload Floorplan</button>
      </div>

      {imageB64 && dims && (
        <>
          <div style={{ marginTop: 20 }}>
            <button onClick={handleFindBest} disabled={loading}>
              {loading ? "Loading..." : "Find Best Router"}
            </button>
            <button onClick={handleReset} style={{ marginLeft: 10 }} disabled={loading}>
              Reset
            </button>
          </div>

          {loading && (
            <p style={{ marginTop: 10, fontStyle: "italic" }}>
              Finding best router position...
            </p>
          )}

          <div style={{ marginTop: 30, display: "flex", justifyContent: "center" }}>
            <FloorplanCanvas
              imageB64={imageB64}
              dims={dims}
              heatmapUrl={heatmapUrl}
              onCanvasClick={handleCanvasClick}
              disabled={loading}
              bestPoint={bestPoint}
            />
          </div>
        </>
      )}
    </div>
  );
}