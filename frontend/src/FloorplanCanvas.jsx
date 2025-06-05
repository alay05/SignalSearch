import React, { useEffect, useRef } from "react";

export default function FloorplanCanvas({ imageB64, dims, heatmapUrl, onCanvasClick }) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);

  // floorplan image
  useEffect(() => {
    if (!imageB64 || !dims) return;
    const [h, w] = dims;
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    c.width = w;
    c.height = h;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
    };
    img.src = `data:image/png;base64,${imageB64}`;
  }, [imageB64, dims]);

  // heatmap overlay
  useEffect(() => {
    if (!dims) return;
    const [h, w] = dims;
    const c = overlayRef.current;
    const ctx = c.getContext("2d");
    c.width = w;
    c.height = h;
    if (heatmapUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, w, h);
        ctx.globalAlpha = 0.6;
        ctx.drawImage(img, 0, 0, w, h);
        ctx.globalAlpha = 1.0;
      };
      img.src = heatmapUrl;
    } else {
      ctx.clearRect(0, 0, w, h);
    }
  }, [heatmapUrl, dims]);

  // user clicks on floorplan
  const handleClick = (e) => {
    if (!dims) return;
    const [h, w] = dims;
    const rect = e.target.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);
    onCanvasClick(x, y); 
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* floorplan */}
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          cursor: "crosshair",
          zIndex: 1,
        }}
      />

      {/* heatmap */}
      <canvas
        ref={overlayRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
    </div>
  );
}