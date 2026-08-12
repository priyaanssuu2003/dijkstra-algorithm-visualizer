export class Node {
    constructor(id, x, y, label = null) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.label = label || String.fromCharCode(65 + id); // A, B, C...
    }
}

export class Edge {
    constructor(sourceId, targetId, weight) {
        this.sourceId = sourceId;
        this.targetId = targetId;
        this.weight = weight;
    }
}

export class Graph {
    constructor() {
        this.nodes = new Map(); // id -> Node
        this.edges = []; // Array of Edges
        this.nextNodeId = 0;
    }

    addNode(x, y, label = null) {
        const id = this.nextNodeId++;
        const node = new Node(id, x, y, label);
        this.nodes.set(id, node);
        return node;
    }

    addEdge(sourceId, targetId, weight) {
        if (sourceId === targetId) return null;
        
        // Prevent duplicate edges
        const existing = this.edges.find(e => 
            (e.sourceId === sourceId && e.targetId === targetId) ||
            (e.sourceId === targetId && e.targetId === sourceId)
        );
        
        if (existing) {
            existing.weight = weight; // Update weight if exists
            return existing;
        }

        const edge = new Edge(sourceId, targetId, weight);
        this.edges.push(edge);
        return edge;
    }

    deleteNode(id) {
        this.nodes.delete(id);
        this.edges = this.edges.filter(e => e.sourceId !== id && e.targetId !== id);
    }

    deleteEdge(sourceId, targetId) {
        this.edges = this.edges.filter(e => 
            !(e.sourceId === sourceId && e.targetId === targetId) &&
            !(e.sourceId === targetId && e.targetId === sourceId)
        );
    }

    clear() {
        this.nodes.clear();
        this.edges = [];
        this.nextNodeId = 0;
    }

    getAdjacencyList() {
        const adj = new Map();
        for (const [id] of this.nodes) {
            adj.set(id, []);
        }
        for (const edge of this.edges) {
            // Undirected graph
            adj.get(edge.sourceId).push({ target: edge.targetId, weight: edge.weight });
            adj.get(edge.targetId).push({ target: edge.sourceId, weight: edge.weight });
        }
        return adj;
    }
    
    getStats() {
        return {
            vertices: this.nodes.size,
            edges: this.edges.length
        };
    }
}
