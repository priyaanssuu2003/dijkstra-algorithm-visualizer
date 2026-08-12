import { Graph } from './graph.js';
import { CanvasController } from './canvas.js';
import { dijkstraGenerator } from './dijkstra.js';
import { UIController } from './ui.js';

class App {
    constructor() {
        this.graph = new Graph();
        this.canvasCtrl = new CanvasController('graph-canvas', this.graph);
        this.ui = new UIController(this.graph, this.canvasCtrl);
        
        this.algoGenerator = null;
        this.algoTimer = null;
        this.isRunning = false;
        
        // Edge creation state
        this.pendingEdgeSource = null;
        this.pendingEdgeTarget = null;
        
        this.initEvents();
        this.loadExampleGraphs();
        
        // Initial setup
        this.ui.updateNodeDropdowns();
        this.ui.updateStatus('Ready');
    }

    initEvents() {
        // Toolbar tools
        this.ui.els.tools.select.addEventListener('click', () => this.setTool('select'));
        this.ui.els.tools.addNode.addEventListener('click', () => this.setTool('add-node'));
        this.ui.els.tools.addEdge.addEventListener('click', () => this.setTool('add-edge'));
        this.ui.els.tools.delete.addEventListener('click', () => this.setTool('delete'));
        
        // Canvas interactions
        this.canvasCtrl.canvas.addEventListener('mouseup', () => {
            if (this.canvasCtrl.mode === 'add-node' || this.canvasCtrl.mode === 'delete') {
                this.onGraphChanged();
            }
        });
        
        this.canvasCtrl.onEdgeAddRequest = (sourceNode, targetNode) => {
            this.promptEdgeWeight(sourceNode, targetNode);
        };

        // Graph controls
        this.ui.els.btnClear.addEventListener('click', () => {
            if (confirm("Are you sure you want to clear the graph?")) {
                this.graph.clear();
                this.onGraphChanged();
            }
        });
        
        const exampleSelect = document.getElementById('example-graphs');
        exampleSelect.addEventListener('change', (e) => {
            this.loadExample(e.target.value);
            e.target.value = ""; // reset
        });

        // Algorithm Controls
        this.ui.els.btnRun.addEventListener('click', () => this.runAlgorithm());
        this.ui.els.btnPause.addEventListener('click', () => this.pauseAlgorithm());
        this.ui.els.btnStep.addEventListener('click', () => this.stepAlgorithm());
        this.ui.els.btnReset.addEventListener('click', () => this.resetAlgorithm());
        
        // Modal Events
        document.getElementById('btn-cancel-weight').addEventListener('click', () => this.closeWeightModal());
        document.getElementById('btn-confirm-weight').addEventListener('click', () => this.confirmEdgeWeight());
    }
    
    setTool(toolName) {
        Object.values(this.ui.els.tools).forEach(btn => btn.classList.remove('active'));
        
        let targetTool = null;
        if (toolName === 'select') targetTool = this.ui.els.tools.select;
        if (toolName === 'add-node') targetTool = this.ui.els.tools.addNode;
        if (toolName === 'add-edge') targetTool = this.ui.els.tools.addEdge;
        if (toolName === 'delete') targetTool = this.ui.els.tools.delete;
        
        if (targetTool) targetTool.classList.add('active');
        
        this.canvasCtrl.setMode(toolName);
    }

    onGraphChanged() {
        this.ui.updateNodeDropdowns();
        this.resetAlgorithm();
    }

    promptEdgeWeight(sourceNode, targetNode) {
        this.pendingEdgeSource = sourceNode;
        this.pendingEdgeTarget = targetNode;
        
        const modal = document.getElementById('weight-modal');
        const input = document.getElementById('edge-weight-input');
        const error = document.getElementById('weight-error');
        
        modal.classList.remove('hidden');
        error.classList.add('hidden');
        input.value = '';
        input.focus();
    }

    closeWeightModal() {
        document.getElementById('weight-modal').classList.add('hidden');
        this.pendingEdgeSource = null;
        this.pendingEdgeTarget = null;
    }

    confirmEdgeWeight() {
        const input = document.getElementById('edge-weight-input').value;
        const weight = parseInt(input, 10);
        
        if (isNaN(weight) || weight < 0) {
            document.getElementById('weight-error').classList.remove('hidden');
            return;
        }
        
        this.graph.addEdge(this.pendingEdgeSource.id, this.pendingEdgeTarget.id, weight);
        this.closeWeightModal();
        this.onGraphChanged();
        this.canvasCtrl.draw();
    }

    // --- Algorithm Logic ---

    getSpeedMs() {
        const val = this.ui.els.speedSlider.value; // 1 to 100
        // map 100 -> 100ms, 1 -> 2000ms
        return 2000 - ((val - 1) / 99) * 1900;
    }

    runAlgorithm() {
        if (!this.algoGenerator) {
            const sourceId = parseInt(this.ui.els.sourceNode.value);
            const destId = this.ui.els.destNode.value;
            this.algoGenerator = dijkstraGenerator(this.graph, sourceId, destId);
            this.canvasCtrl.setAlgorithmState({ sourceNode: sourceId, destNode: destId === 'any' ? null : parseInt(destId) });
        }
        
        this.isRunning = true;
        this.ui.updateStatus('Running');
        this.executeNextStep();
    }

    pauseAlgorithm() {
        this.isRunning = false;
        if (this.algoTimer) {
            clearTimeout(this.algoTimer);
            this.algoTimer = null;
        }
        this.ui.updateStatus('Paused');
    }

    stepAlgorithm() {
        if (!this.algoGenerator) {
            const sourceId = parseInt(this.ui.els.sourceNode.value);
            const destId = this.ui.els.destNode.value;
            this.algoGenerator = dijkstraGenerator(this.graph, sourceId, destId);
            this.canvasCtrl.setAlgorithmState({ sourceNode: sourceId, destNode: destId === 'any' ? null : parseInt(destId) });
            this.ui.updateStatus('Paused');
        }
        this.executeNextStep(true);
    }

    resetAlgorithm() {
        this.pauseAlgorithm();
        this.algoGenerator = null;
        this.canvasCtrl.clearAlgorithmState();
        this.ui.updateStatus('Ready');
    }

    executeNextStep(isManualStep = false) {
        if (!this.algoGenerator) return;

        const result = this.algoGenerator.next();
        
        if (result.done) {
            this.isRunning = false;
            this.ui.updateStatus('Completed');
            return;
        }

        const state = result.value;
        this.processAlgorithmState(state);

        if (this.isRunning && !isManualStep) {
            this.algoTimer = setTimeout(() => this.executeNextStep(), this.getSpeedMs());
        }
    }

    processAlgorithmState(state) {
        // 1. Update Canvas Visuals
        const canvasState = {
            examiningNode: null,
            examiningEdges: [],
            visitedNodes: state.visited || new Set()
        };

        if (state.type === 'SELECT_MIN' || state.type === 'MARK_VISITED') {
            canvasState.examiningNode = state.currentId;
        } else if (state.type === 'EXAMINE_EDGE' || state.type === 'CALC_DISTANCE' || state.type === 'UPDATE_DISTANCE' || state.type === 'NO_UPDATE') {
            canvasState.examiningNode = state.currentId;
            canvasState.examiningEdges = [{ sourceId: state.currentId, targetId: state.neighborId }];
        } else if (state.type === 'FINISH') {
            canvasState.pathEdges = [];
            if (state.path && state.path.length > 0) {
                for (let i = 0; i < state.path.length - 1; i++) {
                    canvasState.pathEdges.push({
                        sourceId: state.path[i],
                        targetId: state.path[i+1]
                    });
                }
            }
        }
        
        this.canvasCtrl.setAlgorithmState(canvasState);

        // 2. Update UI
        this.ui.updateDistanceTable(state.distances, state.previous, state.visited);
        this.ui.setExplanation(state.explanation, state.why);
        this.ui.highlightPseudocode(state.pseudocodeLine);
        
        if (state.type === 'FINISH') {
            const destId = this.ui.els.destNode.value;
            this.ui.showStats(destId, state.distances, state.previous, state.path);
        }
    }

    // --- Examples ---
    loadExampleGraphs() {
        this.examples = {
            'example1': () => {
                this.graph.clear();
                const nA = this.graph.addNode(150, 150, 'A');
                const nB = this.graph.addNode(350, 100, 'B');
                const nC = this.graph.addNode(550, 200, 'C');
                const nD = this.graph.addNode(250, 300, 'D');
                const nE = this.graph.addNode(450, 350, 'E');
                this.graph.addEdge(nA.id, nB.id, 4);
                this.graph.addEdge(nA.id, nD.id, 1);
                this.graph.addEdge(nB.id, nC.id, 2);
                this.graph.addEdge(nB.id, nE.id, 3);
                this.graph.addEdge(nC.id, nE.id, 1);
                this.graph.addEdge(nD.id, nE.id, 2);
                this.ui.els.sourceNode.value = nA.id;
                this.ui.els.destNode.value = nE.id;
            },
            'example2': () => {
                this.graph.clear();
                const nA = this.graph.addNode(100, 200, 'A');
                const nB = this.graph.addNode(250, 100, 'B');
                const nC = this.graph.addNode(400, 100, 'C');
                const nD = this.graph.addNode(250, 300, 'D');
                const nE = this.graph.addNode(400, 300, 'E');
                const nF = this.graph.addNode(550, 200, 'F');
                this.graph.addEdge(nA.id, nB.id, 2);
                this.graph.addEdge(nA.id, nD.id, 4);
                this.graph.addEdge(nB.id, nC.id, 3);
                this.graph.addEdge(nB.id, nD.id, 1);
                this.graph.addEdge(nB.id, nE.id, 5);
                this.graph.addEdge(nC.id, nF.id, 2);
                this.graph.addEdge(nD.id, nE.id, 1);
                this.graph.addEdge(nE.id, nC.id, 1);
                this.graph.addEdge(nE.id, nF.id, 4);
                this.ui.els.sourceNode.value = nA.id;
                this.ui.els.destNode.value = nF.id;
            },
            'example3': () => {
                this.graph.clear();
                const nA = this.graph.addNode(150, 250, 'A');
                const nB = this.graph.addNode(300, 150, 'B');
                const nC = this.graph.addNode(450, 150, 'C');
                const nD = this.graph.addNode(300, 350, 'D');
                const nE = this.graph.addNode(450, 350, 'E');
                const nF = this.graph.addNode(600, 250, 'F');
                const nG = this.graph.addNode(750, 250, 'G');
                this.graph.addEdge(nA.id, nB.id, 5);
                this.graph.addEdge(nA.id, nD.id, 2);
                this.graph.addEdge(nB.id, nC.id, 1);
                this.graph.addEdge(nD.id, nB.id, 1); // Note: Since undirected in this setup, will be 1
                this.graph.addEdge(nD.id, nE.id, 8);
                this.graph.addEdge(nC.id, nF.id, 3);
                this.graph.addEdge(nE.id, nF.id, 2);
                this.graph.addEdge(nF.id, nG.id, 4);
                this.ui.els.sourceNode.value = nA.id;
                this.ui.els.destNode.value = nG.id;
            }
        };
    }

    loadExample(exampleId) {
        if (this.examples[exampleId]) {
            this.examples[exampleId]();
            this.onGraphChanged();
            this.canvasCtrl.draw();
            this.setTool('select');
        }
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    // Load example 2 by default to show a nice graph on start
    window.app.loadExample('example2');
});
