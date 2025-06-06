import io
import cv2
import matplotlib.pyplot as plt
import numpy as np
from skimage.graph import MCP_Geometric
from PIL import Image

TARGET_DIM = 300

def preprocess_image(image_bytes: bytes, target_dim: int = TARGET_DIM):
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img_bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise ValueError("Could not decode image. Make sure it's a valid PNG/JPG.")
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    inv = cv2.bitwise_not(gray)
    _, binary = cv2.threshold(inv, 240, 255, cv2.THRESH_BINARY)
    coords = cv2.findNonZero(binary)
    if coords is None:
        raise ValueError("Image is blank/white—no content detected.")
    x, y, w, h = cv2.boundingRect(coords)
    cropped = gray[y : y + h, x : x + w]

    h0, w0 = cropped.shape
    if w0 > h0:
        new_w = target_dim
        new_h = int(target_dim * h0 / w0)
    else:
        new_h = target_dim
        new_w = int(target_dim * w0 / h0)
    resized = cv2.resize(cropped, (new_w, new_h), interpolation=cv2.INTER_NEAREST)

    grid = np.where(resized > 128, 1, 20)
    return grid, resized


def compute_heatmap(grid: np.ndarray, start_point: tuple[int, int]):
    mcp = MCP_Geometric(grid.astype(float), fully_connected=True)
    costs, _ = mcp.find_costs([start_point])
    masked = np.ma.masked_where(grid > 1, costs)
    return masked


def costs_to_png(masked_costs: np.ma.MaskedArray):
    fig, ax = plt.subplots(figsize=(4, 4), dpi=100)
    cmap = plt.cm.hot
    cmap.set_bad(color="black")
    ax.imshow(masked_costs, cmap=cmap, interpolation="nearest")
    ax.axis("off")

    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", pad_inches=0)
    buf.seek(0)
    plt.close(fig)
    return buf.read()