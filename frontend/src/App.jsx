import React, { useState, useRef } from "react";
import {uploadFloorplan, fetchHeatmap, getBestRouter,} from "./api";
import FloorplanCanvas from "./FloorplanCanvas";  

export default function App() { 
  const fileInputRef = useRef(null);
  const [imageB64, setImageB64] = useState(null); 
  const [dims, setDims] = useState(null);
  const [heatmapUrl, setHeatmapUrl] = useState(null);

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
    } catch (err) {
      alert("Upload failed:\n" + err.message);
    }
  };

  const handleCanvasClick = async (x, y) => {
    if (!dims) return; 
    try {
      const url = await fetchHeatmap(x, y);
      setHeatmapUrl(url); 
    } catch (err) {
      alert("Heatmap request failed:\n" + err.message);
    }
  };

  const handleFindBest = async () => {
    if (!dims) return;
    try {
      const data = await getBestRouter(50);
      const { best_point } = data;
      const r = best_point.row;
      const c = best_point.col;
      const url = await fetchHeatmap(c, r);
      setHeatmapUrl(url);
    } catch (err) {
      alert("Best Router failed:\n" + err.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Wi-Fi Router Optimizer</h2>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ marginRight: 10 }}
      />
      <button onClick={handleUploadFloorplan}>
        Upload Floorplan
      </button>
      {imageB64 && dims && (
        <>
          <button onClick={handleFindBest} style={{ marginLeft: 10 }}>
            Find Best Router
          </button>
          <div style={{ marginTop: 20 }}>
            <FloorplanCanvas
              imageB64={imageB64}
              dims={dims}
              heatmapUrl={heatmapUrl}
              onCanvasClick={handleCanvasClick}
            />
          </div>
        </>
      )}
    </div>
  );
}