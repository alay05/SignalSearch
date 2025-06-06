import React, { useEffect, useRef } from "react";

export default function FloorplanCanvas({
  imageB64,
  dims,         // [origHeight, origWidth]
  heatmapUrl,
  onCanvasClick,
}) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);

  // Max bounding box for display
  const MAX_SIZE = 512;

  // Calculate display dimensions while preserving aspect ratio
  let displayWidth = MAX_SIZE;
  let displayHeight = MAX_SIZE;
  if (dims) {
    const [origH, origW] = dims;
    if (origW > origH) {
      displayHeight = Math.round((origH / origW) * MAX_SIZE);
    } else {
      displayWidth = Math.round((origW / origH) * MAX_SIZE);
    }
  }

  // Draw the floorplan image onto the canvas, scaled
  useEffect(() => {
    if (!imageB64 || !dims) return;
    const [origH, origW] = dims;
    const c = canvasRef.current;
    c.width = displayWidth;
    c.height = displayHeight;
    const ctx = c.getContext("2d");

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, displayWidth, displayHeight);
      ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
    };
    img.src = `data:image/png;base64,${imageB64}`;
  }, [imageB64, dims, displayWidth, displayHeight]);

  // Draw the heatmap overlay, scaled to match the displayed floorplan
  useEffect(() => {
    if (!dims) return;
    const c = overlayRef.current;
    c.width = displayWidth;
    c.height = displayHeight;
    const ctx = c.getContext("2d");

    if (heatmapUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, displayWidth, displayHeight);
        ctx.globalAlpha = 0.6;
        ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
        ctx.globalAlpha = 1.0;
      };
      img.src = heatmapUrl;
    } else {
      ctx.clearRect(0, 0, displayWidth, displayHeight);
    }
  }, [heatmapUrl, dims, displayWidth, displayHeight]);

  // Handle user clicks: map back to original image coordinates
  const handleClick = (e) => {
    if (!dims) return;
    const [origH, origW] = dims;
    const rect = e.target.getBoundingClientRect();

    // Click position in displayed (scaled) canvas space
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    // Scale factors from displayed size back to original image size
    const scaleX = origW / displayWidth;
    const scaleY = origH / displayHeight;

    // Map to original image coordinates
    const x = Math.floor(rawX * scaleX);
    const y = Math.floor(rawY * scaleY);

    onCanvasClick(x, y);
  };

  return (
    <div
      style={{
        position: "relative",
        width: displayWidth,
        height: displayHeight,
        margin: "0 auto",
      }}
    >
      {/* Floorplan canvas */}
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
        width={displayWidth}
        height={displayHeight}
      />

      {/* Heatmap overlay canvas */}
      <canvas
        ref={overlayRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 2,
        }}
        width={displayWidth}
        height={displayHeight}
      />
    </div>
  );
}






