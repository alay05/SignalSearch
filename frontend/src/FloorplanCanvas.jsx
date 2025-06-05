import React, { useEffect, useRef } from "react";

function FloorplanCanvas({ imageB64, dims, heatmapUrl, onClick }) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);

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
    } else {
      ctx.clearRect(0, 0, w, h);
    }
  }, [heatmapUrl, dims]);

  const handleClick = (e) => {
    if (!dims) return;
    const [h, w] = dims;
    const rect = e.target.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);
    onClick(x, y);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{ position: "absolute", top: 0, left: 0, cursor: "crosshair", zIndex: 1 }}
      />
      <canvas
        ref={overlayRef}
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 2 }}
      />
    </div>
  );
}

export default FloorplanCanvas;