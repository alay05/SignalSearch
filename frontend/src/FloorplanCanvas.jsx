import React, { useEffect, useRef } from "react";

export default function FloorplanCanvas({
  imageB64,
  dims,
  heatmapUrl,
  onCanvasClick,
  disabled = false,
  bestPoint = null,
}) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);

  const MAX_SIZE = 512;

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

  useEffect(() => {
    if (!imageB64 || !dims) return;
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

        if (bestPoint) {
          drawDot(ctx, bestPoint);
        }
      };
      img.src = heatmapUrl;
    } else {
      ctx.clearRect(0, 0, displayWidth, displayHeight);
      if (bestPoint) {
        drawDot(ctx, bestPoint); 
      }
    }
  }, [heatmapUrl, dims, bestPoint, displayWidth, displayHeight]);

  const drawDot = (ctx, [r, c]) => {
    const [origH, origW] = dims;
    const scaleX = displayWidth / origW;
    const scaleY = displayHeight / origH;
    const x = c * scaleX;
    const y = r * scaleY;

    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "blue";
    ctx.fill();
  };

  const handleClick = (e) => {
    if (disabled || !dims) return;
    const [origH, origW] = dims;
    const rect = e.target.getBoundingClientRect();

    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    const scaleX = origW / displayWidth;
    const scaleY = origH / displayHeight;

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
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          cursor: disabled ? "not-allowed" : "crosshair",
          zIndex: 1,
        }}
        width={displayWidth}
        height={displayHeight}
      />

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
