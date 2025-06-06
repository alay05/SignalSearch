import io
import base64
import traceback

from flask import Flask, request, jsonify, send_file, abort
from flask_cors import CORS
import cv2
import numpy as np
from skimage.graph import MCP_Geometric
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from floorplan_utils import preprocess_image, compute_heatmap, costs_to_png, TARGET_DIM

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"]) 

GRID_STORE = {"grid": None,"resized_shape": None,}

@app.route("/upload-floorplan", methods=["POST"])
def upload_floorplan():
    if "file" not in request.files:
        return jsonify({"detail": "No file part in the request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"detail": "No file selected"}), 400

    try:
        image_bytes = file.read()
        grid, resized = preprocess_image(image_bytes)
    except ValueError as ve:
        return jsonify({"detail": str(ve)}), 400
    except Exception as e:
        print("Exception in /upload-floorplan:")
        traceback.print_exc()
        return jsonify({"detail": f"Processing error: {e}"}), 500

    GRID_STORE["grid"] = grid
    GRID_STORE["resized_shape"] = resized.shape

    success, png_buffer = cv2.imencode(".png", resized)
    if not success:
        return jsonify({"detail": "Failed to encode resized image."}), 500

    img_bytes = png_buffer.tobytes()
    b64 = base64.b64encode(img_bytes).decode("utf-8")
    return jsonify({"resized_shape": resized.shape, "image_b64": b64})


@app.route("/heatmap", methods=["POST"])
def heatmap():
    if not request.is_json:
        return jsonify({"detail": "Expected JSON body"}), 400

    data = request.get_json()
    if "x" not in data or "y" not in data:
        return jsonify({"detail": "Missing 'x' or 'y' in request body"}), 422

    x = data["x"]
    y = data["y"]
    if not isinstance(x, int) or not isinstance(y, int):
        return jsonify({"detail": "'x' and 'y' must be integers"}), 422

    grid = GRID_STORE.get("grid")
    shape = GRID_STORE.get("resized_shape")
    if grid is None or shape is None:
        return jsonify({"detail": "No floorplan uploaded yet"}), 400

    h, w = shape
    if not (0 <= x < w and 0 <= y < h):
        return jsonify({"detail": "Clicked point outside image bounds"}), 400

    try:
        masked_costs = compute_heatmap(grid, (y, x))
        png_bytes = costs_to_png(masked_costs)
    except Exception as e:
        print("Exception in /heatmap:")
        traceback.print_exc()
        return jsonify({"detail": f"Heatmap generation error: {e}"}), 500

    return send_file(
        io.BytesIO(png_bytes),
        mimetype="image/png",
        as_attachment=False,
        download_name="heatmap.png",
    )


@app.route("/best-router", methods=["POST"])
def best_router():
    sc_str = request.args.get("sample_count", default = str(TARGET_DIM//4))
    try:
        sample_count = int(sc_str)
    except ValueError:
        return jsonify({"detail": "'sample_count' must be an integer"}), 422

    grid = GRID_STORE.get("grid")
    if grid is None:
        return jsonify({"detail": "No floorplan uploaded yet"}), 400

    valid = [(r, c) for r in range(grid.shape[0]) for c in range(grid.shape[1]) if grid[r, c] == 1]
    if not valid:
        return jsonify({"detail": "No open cells found in grid"}), 400

    try: 
        idxs = np.random.choice(len(valid), size=min(sample_count, len(valid)), replace=False)
        best_pt, best_avg = None, np.inf

        for i in idxs:
            pt = valid[int(i)]
            mcp = MCP_Geometric(grid.astype(float), fully_connected=True)
            costs, _ = mcp.find_costs([pt])
            reachable = (grid == 1) & np.isfinite(costs)
            avg_cost = np.mean(costs[reachable]) if reachable.sum() else np.inf
            if avg_cost < best_avg:
                best_avg, best_pt = avg_cost, pt

        directions = [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(-1,1),(1,-1),(1,1)]
        improved = True
        while improved:
            improved = False
            for dr, dc in directions:
                nr, nc = best_pt[0] + dr, best_pt[1] + dc
                if 0 <= nr < grid.shape[0] and 0 <= nc < grid.shape[1] and grid[nr, nc] == 1:
                    mcp = MCP_Geometric(grid.astype(float), fully_connected=True)
                    costs, _ = mcp.find_costs([(nr, nc)])
                    reachable = (grid == 1) & np.isfinite(costs)
                    avg_cost = np.mean(costs[reachable]) if reachable.sum() else np.inf
                    if avg_cost < best_avg:
                        best_avg, best_pt = avg_cost, (nr, nc)
                        improved = True
                        break

        return jsonify({
            "best_point": {"row": best_pt[0], "col": best_pt[1]},
            "average_cost": float(best_avg),
        })

    except Exception as e:
        print("Exception in /best-router:")
        traceback.print_exc()
        return jsonify({"detail": f"Best-router error: {e}"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True, threaded=True)
