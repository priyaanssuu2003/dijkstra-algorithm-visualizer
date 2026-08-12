export class UIController {
    constructor(graph, canvasCtrl) {
        this.graph = graph;
        this.canvasCtrl = canvasCtrl;
        
        // Cache DOM elements
        this.els = {
            sourceNode: document.getElementById('source-node'),
            destNode: document.getElementById('dest-node'),
            btnRun: document.getElementById('btn-run'),
            btnStep: document.getElementById('btn-step'),
            btnPause: document.getElementById('btn-pause'),
            btnReset: document.getElementById('btn-reset'),
            btnClear: document.getElementById('btn-clear'),
            algoStatus: document.getElementById('algo-status'),
            distanceTableBody: document.querySelector('#distance-table tbody'),
            explanationText: document.getElementById('explanation-text'),
            whyBox: document.getElementById('why-happen-box'),
            whyText: document.getElementById('why-text'),
            speedSlider: document.getElementById('speed-slider'),
            statsPanel: document.getElementById('stats-panel'),
            statDistance: document.getElementById('stat-distance'),
            statPath: document.getElementById('stat-path'),
            btnShowPathDetails: document.getElementById('btn-show-path-details'),
            pathDetails: document.getElementById('path-details'),
            tools: {
                select: document.getElementById('tool-select'),
                addNode: document.getElementById('tool-add-node'),
                addEdge: document.getElementById('tool-add-edge'),
                delete: document.getElementById('tool-delete')
            }
        };

        this.initTheme();
    }

    initTheme() {
        const btnTheme = document.getElementById('theme-toggle-btn');
        btnTheme.addEventListener('click', () => {
            const html = document.documentElement;
            const isDark = html.getAttribute('data-theme') === 'dark';
            html.setAttribute('data-theme', isDark ? 'light' : 'dark');
            this.canvasCtrl.draw();
        });
    }

    updateNodeDropdowns() {
        const sourceVal = this.els.sourceNode.value;
        const destVal = this.els.destNode.value;

        this.els.sourceNode.innerHTML = '';
        this.els.destNode.innerHTML = '<option value="any">Any (Full Dijkstra)</option>';

        for (const [id, node] of this.graph.nodes) {
            const opt1 = document.createElement('option');
            opt1.value = id;
            opt1.textContent = `${node.label}`;
            this.els.sourceNode.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = id;
            opt2.textContent = `${node.label}`;
            this.els.destNode.appendChild(opt2);
        }

        if (this.graph.nodes.has(parseInt(sourceVal))) {
            this.els.sourceNode.value = sourceVal;
        } else if (this.graph.nodes.size > 0) {
            this.els.sourceNode.value = this.graph.nodes.keys().next().value;
        }

        if (destVal === 'any' || this.graph.nodes.has(parseInt(destVal))) {
            this.els.destNode.value = destVal;
        }
    }

    updateDistanceTable(distances, previous, visited) {
        this.els.distanceTableBody.innerHTML = '';
        
        for (const [id, node] of this.graph.nodes) {
            const tr = document.createElement('tr');
            
            const tdVertex = document.createElement('td');
            tdVertex.textContent = node.label;
            
            const tdDist = document.createElement('td');
            const dist = distances.get(id);
            tdDist.textContent = dist === Infinity ? '∞' : dist;
            
            const tdPrev = document.createElement('td');
            const prevId = previous.get(id);
            tdPrev.textContent = prevId !== null ? this.graph.nodes.get(prevId).label : '-';
            
            const tdVisited = document.createElement('td');
            tdVisited.textContent = visited.has(id) ? 'Yes' : 'No';
            if (visited.has(id)) {
                tdVisited.style.color = 'var(--success-color)';
                tdVisited.style.fontWeight = 'bold';
            }
            
            tr.appendChild(tdVertex);
            tr.appendChild(tdDist);
            tr.appendChild(tdPrev);
            tr.appendChild(tdVisited);
            
            this.els.distanceTableBody.appendChild(tr);
        }
    }

    setExplanation(text, whyText = null) {
        this.els.explanationText.innerHTML = text;
        if (whyText) {
            this.els.whyBox.classList.remove('hidden');
            this.els.whyText.innerHTML = whyText;
        } else {
            this.els.whyBox.classList.add('hidden');
        }
    }

    highlightPseudocode(lineNumber) {
        // Remove active class from all lines
        document.querySelectorAll('#pseudocode-block span').forEach(el => {
            el.classList.remove('active-line');
        });
        
        // Add active class to target line
        if (lineNumber) {
            const lineEl = document.getElementById(`line-${lineNumber}`);
            if (lineEl) {
                lineEl.classList.add('active-line');
            }
        }
    }

    updateStatus(status) {
        this.els.algoStatus.textContent = status;
        
        if (status === 'Running') {
            this.els.btnRun.disabled = true;
            this.els.btnPause.disabled = false;
            this.els.btnStep.disabled = true;
        } else if (status === 'Paused') {
            this.els.btnRun.disabled = false;
            this.els.btnPause.disabled = true;
            this.els.btnStep.disabled = false;
        } else if (status === 'Completed') {
            this.els.btnRun.disabled = true;
            this.els.btnPause.disabled = true;
            this.els.btnStep.disabled = true;
        } else {
            // Ready
            this.els.btnRun.disabled = this.graph.nodes.size === 0;
            this.els.btnPause.disabled = true;
            this.els.btnStep.disabled = this.graph.nodes.size === 0;
            this.els.statsPanel.classList.add('hidden');
            this.highlightPseudocode(null);
            this.setExplanation('Algorithm is ready. Select a source node and click Run.');
            
            // Empty distance table
            this.els.distanceTableBody.innerHTML = '';
            for (const [id, node] of this.graph.nodes) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${node.label}</td><td>-</td><td>-</td><td>-</td>`;
                this.els.distanceTableBody.appendChild(tr);
            }
        }
    }

    showStats(destId, distances, previous, path) {
        this.els.statsPanel.classList.remove('hidden');
        this.els.pathDetails.classList.add('hidden');
        
        if (destId === 'any') {
            this.els.statDistance.textContent = 'N/A (Full Graph)';
            this.els.statPath.textContent = 'Check Distance Table';
            this.els.btnShowPathDetails.classList.add('hidden');
        } else {
            const dist = distances.get(parseInt(destId));
            if (dist === Infinity) {
                this.els.statDistance.textContent = 'Unreachable';
                this.els.statPath.textContent = 'None';
                this.els.btnShowPathDetails.classList.add('hidden');
            } else {
                this.els.statDistance.textContent = dist;
                const pathLabels = path.map(id => this.graph.nodes.get(id).label).join(' → ');
                this.els.statPath.textContent = pathLabels;
                
                this.els.btnShowPathDetails.classList.remove('hidden');
                
                // Build path details
                let detailHtml = '<p><strong>How the path was reconstructed:</strong></p><ul>';
                let curr = parseInt(destId);
                while (previous.get(curr) !== null) {
                    const prev = previous.get(curr);
                    const currNode = this.graph.nodes.get(curr);
                    const prevNode = this.graph.nodes.get(prev);
                    detailHtml += `<li>Previous node for <strong>${currNode.label}</strong> is <strong>${prevNode.label}</strong>.</li>`;
                    curr = prev;
                }
                detailHtml += `<li><strong>${this.graph.nodes.get(curr).label}</strong> is the source node.</li></ul>`;
                detailHtml += `<p>Reversing this sequence gives: <strong>${pathLabels}</strong></p>`;
                
                this.els.pathDetails.innerHTML = detailHtml;
                
                this.els.btnShowPathDetails.onclick = () => {
                    this.els.pathDetails.classList.toggle('hidden');
                };
            }
        }
    }
}
