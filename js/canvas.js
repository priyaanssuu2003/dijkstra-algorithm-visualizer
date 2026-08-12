export class CanvasController {
    constructor(canvasId, graph) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.graph = graph;
        
        this.nodeRadius = 20;
        this.mode = 'select'; // 'select', 'add-node', 'add-edge', 'delete'
        
        this.selectedNode = null;
        this.hoveredNode = null;
        this.hoveredEdge = null;
        this.dragNode = null;
        
        this.edgeStartNode = null;
        this.tempEdgeEnd = null;

        // Visual state for algorithm
        this.algorithmState = {
            sourceNode: null,
            destNode: null,
            examiningNode: null,
            visitedNodes: new Set(),
            examiningEdges: [], // Array of {sourceId, targetId}
            pathEdges: [] // Final shortest path
        };

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.initEvents();
        
        this.onEdgeAddRequest = null; // Callback when an edge is requested to be added
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = 600; // Fixed height
        this.draw();
    }

    setMode(mode) {
        this.mode = mode;
        this.edgeStartNode = null;
        this.tempEdgeEnd = null;
        this.canvas.style.cursor = mode === 'add-node' ? 'copy' : 
                                   mode === 'add-edge' ? 'crosshair' : 
                                   mode === 'delete' ? 'not-allowed' : 'default';
        this.draw();
    }

    setAlgorithmState(state) {
        this.algorithmState = { ...this.algorithmState, ...state };
        this.draw();
    }
    
    clearAlgorithmState() {
        this.algorithmState = {
            sourceNode: this.algorithmState.sourceNode,
            destNode: this.algorithmState.destNode,
            examiningNode: null,
            visitedNodes: new Set(),
            examiningEdges: [],
            pathEdges: []
        };
        this.draw();
    }

    initEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', () => {
            this.dragNode = null;
            this.tempEdgeEnd = null;
            this.draw();
        });
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    findNodeAt(x, y) {
        for (const [id, node] of this.graph.nodes) {
            const dx = node.x - x;
            const dy = node.y - y;
            if (dx * dx + dy * dy <= this.nodeRadius * this.nodeRadius) {
                return node;
            }
        }
        return null;
    }

    findEdgeAt(x, y) {
        for (const edge of this.graph.edges) {
            const n1 = this.graph.nodes.get(edge.sourceId);
            const n2 = this.graph.nodes.get(edge.targetId);
            if (!n1 || !n2) continue;

            const dist = this.distToSegment(
                {x, y}, 
                {x: n1.x, y: n1.y}, 
                {x: n2.x, y: n2.y}
            );

            if (dist < 10) return edge;
        }
        return null;
    }

    sqr(x) { return x * x; }
    dist2(v, w) { return this.sqr(v.x - w.x) + this.sqr(v.y - w.y); }
    distToSegmentSquared(p, v, w) {
        const l2 = this.dist2(v, w);
        if (l2 === 0) return this.dist2(p, v);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return this.dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
    }
    distToSegment(p, v, w) { return Math.sqrt(this.distToSegmentSquared(p, v, w)); }

    handleMouseDown(e) {
        const pos = this.getMousePos(e);
        const clickedNode = this.findNodeAt(pos.x, pos.y);
        const clickedEdge = this.findEdgeAt(pos.x, pos.y);

        if (this.mode === 'add-node') {
            if (!clickedNode) {
                this.graph.addNode(pos.x, pos.y);
                this.draw();
            }
        } else if (this.mode === 'add-edge') {
            if (clickedNode) {
                this.edgeStartNode = clickedNode;
            }
        } else if (this.mode === 'delete') {
            if (clickedNode) {
                this.graph.deleteNode(clickedNode.id);
                this.draw();
            } else if (clickedEdge) {
                this.graph.deleteEdge(clickedEdge.sourceId, clickedEdge.targetId);
                this.draw();
            }
        } else if (this.mode === 'select') {
            if (clickedNode) {
                this.selectedNode = clickedNode;
                this.dragNode = clickedNode;
            } else {
                this.selectedNode = null;
            }
            this.draw();
        }
    }

    handleMouseMove(e) {
        const pos = this.getMousePos(e);
        
        if (this.dragNode) {
            this.dragNode.x = pos.x;
            this.dragNode.y = pos.y;
            this.draw();
            return;
        }

        if (this.mode === 'add-edge' && this.edgeStartNode) {
            this.tempEdgeEnd = pos;
            this.draw();
            return;
        }

        const node = this.findNodeAt(pos.x, pos.y);
        const edge = !node ? this.findEdgeAt(pos.x, pos.y) : null;

        let needsRedraw = false;
        if (this.hoveredNode !== node) {
            this.hoveredNode = node;
            needsRedraw = true;
        }
        if (this.hoveredEdge !== edge) {
            this.hoveredEdge = edge;
            needsRedraw = true;
        }

        if (needsRedraw) this.draw();
    }

    handleMouseUp(e) {
        this.dragNode = null;

        if (this.mode === 'add-edge' && this.edgeStartNode) {
            const pos = this.getMousePos(e);
            const endNode = this.findNodeAt(pos.x, pos.y);
            
            if (endNode && endNode !== this.edgeStartNode) {
                if (this.onEdgeAddRequest) {
                    this.onEdgeAddRequest(this.edgeStartNode, endNode);
                }
            }
            this.edgeStartNode = null;
            this.tempEdgeEnd = null;
            this.draw();
        }
    }

    // --- Drawing ---
    
    getThemeColors() {
        const style = getComputedStyle(document.body);
        return {
            nodeDefault: style.getPropertyValue('--node-default').trim(),
            nodeBorder: style.getPropertyValue('--node-border').trim(),
            nodeText: style.getPropertyValue('--node-text').trim(),
            nodeSource: style.getPropertyValue('--node-source').trim(),
            nodeDest: style.getPropertyValue('--node-dest').trim(),
            nodeExamining: style.getPropertyValue('--node-examining').trim(),
            nodeVisited: style.getPropertyValue('--node-visited').trim(),
            edgeDefault: style.getPropertyValue('--edge-default').trim(),
            edgeExamining: style.getPropertyValue('--edge-examining').trim(),
            edgePath: style.getPropertyValue('--edge-path').trim(),
            bgMain: style.getPropertyValue('--bg-panel').trim() // Canvas background
        };
    }

    draw() {
        const colors = this.getThemeColors();
        
        // Clear canvas
        this.ctx.fillStyle = colors.bgMain;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw edges
        for (const edge of this.graph.edges) {
            this.drawEdge(edge, colors);
        }

        // Draw temp edge for drag
        if (this.mode === 'add-edge' && this.edgeStartNode && this.tempEdgeEnd) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.edgeStartNode.x, this.edgeStartNode.y);
            this.ctx.lineTo(this.tempEdgeEnd.x, this.tempEdgeEnd.y);
            this.ctx.strokeStyle = colors.nodeBorder;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        // Draw nodes
        for (const [id, node] of this.graph.nodes) {
            this.drawNode(node, colors);
        }
    }

    isEdgeExamined(sourceId, targetId) {
        return this.algorithmState.examiningEdges.some(e => 
            (e.sourceId === sourceId && e.targetId === targetId) ||
            (e.sourceId === targetId && e.targetId === sourceId)
        );
    }
    
    isEdgeInPath(sourceId, targetId) {
        return this.algorithmState.pathEdges.some(e => 
            (e.sourceId === sourceId && e.targetId === targetId) ||
            (e.sourceId === targetId && e.targetId === sourceId)
        );
    }

    drawEdge(edge, colors) {
        const n1 = this.graph.nodes.get(edge.sourceId);
        const n2 = this.graph.nodes.get(edge.targetId);
        if (!n1 || !n2) return;

        this.ctx.beginPath();
        this.ctx.moveTo(n1.x, n1.y);
        this.ctx.lineTo(n2.x, n2.y);
        
        if (this.isEdgeInPath(edge.sourceId, edge.targetId)) {
            this.ctx.strokeStyle = colors.edgePath;
            this.ctx.lineWidth = 4;
        } else if (this.isEdgeExamined(edge.sourceId, edge.targetId)) {
            this.ctx.strokeStyle = colors.edgeExamining;
            this.ctx.lineWidth = 3;
        } else if (this.hoveredEdge === edge) {
            this.ctx.strokeStyle = colors.nodeSource;
            this.ctx.lineWidth = 3;
        } else {
            this.ctx.strokeStyle = colors.edgeDefault;
            this.ctx.lineWidth = 2;
        }
        
        this.ctx.stroke();

        // Draw weight
        const midX = (n1.x + n2.x) / 2;
        const midY = (n1.y + n2.y) / 2;
        
        this.ctx.fillStyle = colors.bgMain;
        this.ctx.beginPath();
        this.ctx.arc(midX, midY, 12, 0, 2 * Math.PI);
        this.ctx.fill();
        
        this.ctx.fillStyle = colors.nodeText;
        this.ctx.font = '12px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(edge.weight, midX, midY);
    }

    drawNode(node, colors) {
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, this.nodeRadius, 0, 2 * Math.PI);
        
        // Determine color
        if (node.id === this.algorithmState.sourceNode) {
            this.ctx.fillStyle = colors.nodeSource;
            this.ctx.strokeStyle = '#ffffff';
        } else if (node.id === this.algorithmState.destNode) {
            this.ctx.fillStyle = colors.nodeDest;
            this.ctx.strokeStyle = '#ffffff';
        } else if (node.id === this.algorithmState.examiningNode) {
            this.ctx.fillStyle = colors.nodeExamining;
            this.ctx.strokeStyle = '#ffffff';
        } else if (this.algorithmState.visitedNodes.has(node.id)) {
            this.ctx.fillStyle = colors.nodeVisited;
            this.ctx.strokeStyle = colors.nodeBorder;
        } else {
            this.ctx.fillStyle = colors.nodeDefault;
            this.ctx.strokeStyle = colors.nodeBorder;
        }

        if (this.hoveredNode === node || this.selectedNode === node) {
            this.ctx.lineWidth = 3;
            if (node.id !== this.algorithmState.sourceNode && node.id !== this.algorithmState.destNode) {
                this.ctx.strokeStyle = colors.nodeSource; // highlight border
            }
        } else {
            this.ctx.lineWidth = 2;
        }

        this.ctx.fill();
        this.ctx.stroke();

        // Node label
        this.ctx.fillStyle = (node.id === this.algorithmState.sourceNode || node.id === this.algorithmState.destNode || node.id === this.algorithmState.examiningNode) ? '#ffffff' : colors.nodeText;
        this.ctx.font = '14px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(node.label, node.x, node.y);
    }
}
