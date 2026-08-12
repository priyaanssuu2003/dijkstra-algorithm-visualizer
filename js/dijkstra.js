export function* dijkstraGenerator(graph, sourceId, destId = 'any') {
    const distances = new Map();
    const previous = new Map();
    const unvisited = new Set();
    const visited = new Set();
    
    // Initialize
    for (const [id, node] of graph.nodes) {
        distances.set(id, Infinity);
        previous.set(id, null);
        unvisited.add(id);
    }
    
    distances.set(sourceId, 0);
    
    yield {
        type: 'INIT',
        distances,
        previous,
        visited,
        explanation: `Step 1: Initialization. Distance to source node ${graph.nodes.get(sourceId).label} is set to 0. All other distances are set to infinity (∞).`,
        why: `We start at the source node, so the distance to itself is 0. Since we haven't explored the graph yet, we don't know the distance to any other node, hence infinity.`,
        pseudocodeLine: 6
    };

    while (unvisited.size > 0) {
        // Find min distance unvisited node
        let currentId = null;
        let minDistance = Infinity;
        
        for (const id of unvisited) {
            const d = distances.get(id);
            if (d < minDistance) {
                minDistance = d;
                currentId = id;
            }
        }
        
        if (currentId === null || minDistance === Infinity) {
            // All remaining nodes are unreachable
            break;
        }

        const currentNode = graph.nodes.get(currentId);
        
        yield {
            type: 'SELECT_MIN',
            currentId,
            distances,
            previous,
            visited,
            explanation: `Step 2: Select Minimum. Node ${currentNode.label} is selected because it has the smallest tentative distance (${minDistance}) among unvisited nodes.`,
            why: `By always expanding the node with the smallest distance first, Dijkstra ensures that when we process a node, we have found the absolute shortest path to it.`,
            pseudocodeLine: 9
        };

        unvisited.delete(currentId);
        visited.add(currentId);
        
        yield {
            type: 'MARK_VISITED',
            currentId,
            distances,
            previous,
            visited,
            explanation: `Step 4: Mark Visited. Node ${currentNode.label} is marked as permanently processed. Its shortest path is known.`,
            why: `We are guaranteed that there is no shorter path to ${currentNode.label} through any unvisited nodes because all unvisited nodes currently have a tentative distance greater than or equal to ${minDistance}.`,
            pseudocodeLine: 10
        };

        if (destId !== 'any' && currentId === parseInt(destId)) {
            // Reached destination
            break;
        }

        // Relax edges
        const neighbors = graph.getAdjacencyList().get(currentId);
        
        for (const neighbor of neighbors) {
            const neighborId = neighbor.target;
            const weight = neighbor.weight;
            
            if (visited.has(neighborId)) continue;
            
            const neighborNode = graph.nodes.get(neighborId);
            
            yield {
                type: 'EXAMINE_EDGE',
                currentId,
                neighborId,
                distances,
                previous,
                visited,
                explanation: `Step 3: Relax Edges. Checking edge ${currentNode.label} → ${neighborNode.label} with weight ${weight}.`,
                why: `We need to see if going through ${currentNode.label} offers a shorter path to ${neighborNode.label} than what we previously found.`,
                pseudocodeLine: 12
            };

            const newDistance = distances.get(currentId) + weight;
            const oldDistance = distances.get(neighborId);
            
            yield {
                type: 'CALC_DISTANCE',
                currentId,
                neighborId,
                newDistance,
                oldDistance,
                distances,
                previous,
                visited,
                explanation: `Calculating new distance to ${neighborNode.label}: Distance to ${currentNode.label} (${distances.get(currentId)}) + edge weight (${weight}) = ${newDistance}.`,
                why: `If this new distance (${newDistance}) is less than the current known distance (${oldDistance === Infinity ? '∞' : oldDistance}), we will update it.`,
                pseudocodeLine: 13
            };

            if (newDistance < oldDistance) {
                distances.set(neighborId, newDistance);
                previous.set(neighborId, currentId);
                
                yield {
                    type: 'UPDATE_DISTANCE',
                    currentId,
                    neighborId,
                    distances,
                    previous,
                    visited,
                    explanation: `New distance to ${neighborNode.label} is shorter (${newDistance} < ${oldDistance === Infinity ? '∞' : oldDistance}). Updating distance and previous node.`,
                    why: `Distance to ${neighborNode.label} changed from ${oldDistance === Infinity ? '∞' : oldDistance} to ${newDistance} because the path through ${currentNode.label} is shorter.`,
                    pseudocodeLine: 15
                };
            } else {
                yield {
                    type: 'NO_UPDATE',
                    currentId,
                    neighborId,
                    distances,
                    previous,
                    visited,
                    explanation: `New distance (${newDistance}) is NOT shorter than current distance (${oldDistance}). No update.`,
                    why: `We already have a better (or equal) path to ${neighborNode.label}.`,
                    pseudocodeLine: 14
                };
            }
        }
    }
    
    // Reconstruct path if destId is specific
    let path = [];
    if (destId !== 'any') {
        let curr = parseInt(destId);
        if (previous.get(curr) !== null || curr === sourceId) {
            while (curr !== null) {
                path.unshift(curr);
                curr = previous.get(curr);
            }
        }
    }
    
    yield {
        type: 'FINISH',
        distances,
        previous,
        visited,
        path,
        explanation: `Algorithm completed. All reachable nodes have been visited${destId !== 'any' ? ' or destination reached' : ''}.`,
        why: `There are no more unvisited nodes to process, or we have found the shortest path to our destination.`,
        pseudocodeLine: 18
    };
}
