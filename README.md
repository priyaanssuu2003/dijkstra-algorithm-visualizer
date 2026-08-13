# PathFinder — Dijkstra's Algorithm Visualizer

## 🌐 Overview
**PathFinder** is an interactive, web-based visualizer for Dijkstra's Shortest Path Algorithm. It allows users to build custom graph networks by adding nodes and edges, and watch in real-time as the algorithm computes the optimal path from a source to a destination.

## ✨ Features
- **Interactive Graph Builder:** Click to add nodes, draw edges, and set edge weights dynamically.
- **Real-Time Visualization:** Watch the algorithm step-by-step as it explores neighbors and updates distances.
- **Playback Controls:** Run, Pause, Step Forward, and adjust the execution speed.
- **Dynamic Distance Table:** See the underlying distance array and previous-node references update live.
- **Code Execution Tracing:** A pseudocode panel highlights the exact line of the algorithm currently being executed.
- **Prebuilt Examples:** Load simple or complex graph topologies with a single click.

## 🛠️ Technologies Used
- **HTML5 Canvas:** For rendering the nodes, edges, and real-time path highlights.
- **CSS3:** Responsive dashboard layout, dark theme, and control styling.
- **JavaScript (Vanilla):** Implements graph data structures (Adjacency List), the Priority Queue (Min-Heap) for the algorithm, and the Canvas rendering loop.

## ⚙️ How It Works
1. **Graph Representation:** The network is stored as an Adjacency List.
2. **Algorithm Execution:** When executed, a custom implementation of Dijkstra's algorithm uses a Priority Queue to efficiently find the next unvisited node with the smallest tentative distance.
3. **State Management:** The algorithm's state at each step (visited nodes, current distances) is stored in a playback array, allowing the UI to step through the execution visually.

## 📂 Project Structure
```text
pathfinder/
├── index.html      # Main visualizer layout and controls
├── css/
│   └── styles.css  # Application styling and dark mode
└── js/
    ├── app.js      # Main controller (Event listeners, UI updates)
    ├── graph.js    # Graph Data Structure and Canvas logic
    └── dijkstra.js # Algorithm implementation and state tracking
```

## 🚀 Usage
Simply open `index.html` in any modern web browser. No installation or build steps are required.
1. Click **Add Node** and click on the canvas to place nodes.
2. Click **Add Edge**, then click two nodes to connect them and set a weight.
3. Select a Source node from the dropdown.
4. Click **▶ Run Dijkstra** to watch the algorithm execute.

## 🧠 Key Learnings
- Implementing advanced Data Structures (Graphs, Priority Queues) in JavaScript.
- Synchronizing complex algorithmic state with visual UI updates.
- Working with HTML5 `<canvas>` for interactive 2D rendering.

## 🔮 Future Improvements
- Add support for other pathfinding algorithms (A* Search, Bellman-Ford).
- Allow dragging and repositioning of nodes after they are placed.
- Add support for directed vs. undirected graphs.
