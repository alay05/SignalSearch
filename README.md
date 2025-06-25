# SignalSearch

## Project Description

This code showcases a proof of concept for a web-based app that finds the optimal placement for a Wi-Fi router based on a floorplan. It analyzes an uploaded floorplan and simulates signal strength using Dijkstra's algorithm to account for walls and distance decay. The results are visualized with an interactive heatmap overlaid on the floorplan.

https://github.com/user-attachments/assets/fd6df947-e664-484f-9bed-3937a453d4e6

## Features

- **Floorplan Upload**: Users upload a PNG or JPG image of a floorplan
- **Signal Simulation**: Click on any location to simulate Wi-Fi coverage from that point
- **Best Router Location**: Uses Dijkstra's algorithm (via scikit-image's MCP Geometric) to simulate signal spread and automatically compute the best location by penalizing walls and obstacles that could obstruct WiFi signal
- **Interactive Visualization**: Scaled canvas view of the floorplan, heatmap overlays to indicate signal strength, blue dot indicating current router location (either user selected or determined by the algorithm)

## Tech Stack

- **Frontend**: React, Tailwind CSS, HTML Canvas API
- **Backend**: Python with Flask
- **Pathfinding & Signal Modeling**: OpenCV for image preprocessing, scikit-image's MCP_Geometric (an extension of Dijkstra's algorithm) for distance-based simulation, Matplotlib for rendering heatmaps

## Running Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/alay05/SignalSearch.git
   cd SignalSearch
2. In one terminal, start the backend:
   ```bash
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    python app.py
3. In a new terminal, start the frontend
   ```bash
    npm install
    npm start
4. Visit http://localhost:3000 in your browser.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.