// PathfindingVisualizer.jsx
import React, { useRef, useState, useEffect } from 'react';
import './TspVisualizer.css';

const PathfindingVisualizer = () => {
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [adjList, setAdjList] = useState([]);
  const [finalPath, setFinalPath] = useState([]);
  const [explorationPaths, setExplorationPaths] = useState([]);
  const [algorithm, setAlgorithm] = useState('');
  const [message, setMessage] = useState('');
  const NODE_DELAY = 200; // delay (ms) between steps
  const numNodes = 40;
  const k = 3; // number of nearest neighbors

  // Euclidean distance.
  const distance = (a, b) =>
    Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

  // Generate 15 random nodes and build an adjacency list using k-nearest neighbors.
  useEffect(() => {
    const generatedNodes = [];
    for (let i = 0; i < numNodes; i++) {
      generatedNodes.push({
        x: Math.random() * 500 + 50,
        y: Math.random() * 500 + 50,
      });
    }
    setNodes(generatedNodes);

    const newAdjList = Array(numNodes).fill(0).map(() => []);
    for (let i = 0; i < numNodes; i++) {
      let distances = [];
      for (let j = 0; j < numNodes; j++) {
        if (i !== j) {
          distances.push({ node: j, dist: distance(generatedNodes[i], generatedNodes[j]) });
        }
      }
      distances.sort((a, b) => a.dist - b.dist);
      for (let n = 0; n < k && n < distances.length; n++) {
        const neighbor = distances[n].node;
        if (!newAdjList[i].includes(neighbor)) newAdjList[i].push(neighbor);
        if (!newAdjList[neighbor].includes(i)) newAdjList[neighbor].push(i);
      }
    }
    setAdjList(newAdjList);
  }, []);

  useEffect(() => {
    draw();
  }, [nodes, adjList, finalPath, explorationPaths]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges.
    for (let i = 0; i < adjList.length; i++) {
      adjList[i].forEach((j) => {
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.strokeStyle = 'lightgray';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

    // Draw nodes.
    nodes.forEach((node, index) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = 'black';
      ctx.fill();
      ctx.strokeText(index, node.x + 5, node.y + 5);
    });

    // Mark start (node 0) and goal (last node).
    if (nodes.length > 0) {
      // Start.
      ctx.beginPath();
      ctx.arc(nodes[0].x, nodes[0].y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = 'green';
      ctx.fill();
      ctx.strokeText('S', nodes[0].x + 7, nodes[0].y + 7);
      // Goal.
      ctx.beginPath();
      ctx.arc(nodes[numNodes - 1].x, nodes[numNodes - 1].y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();
      ctx.strokeText('G', nodes[numNodes - 1].x + 7, nodes[numNodes - 1].y + 7);
    }

    // Draw candidate exploration paths (in blue).
    explorationPaths.forEach((path) => {
      if (path.length > 0) {
        ctx.beginPath();
        ctx.moveTo(nodes[path[0]].x, nodes[path[0]].y);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(nodes[path[i]].x, nodes[path[i]].y);
        }
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Draw final path (in red).
    if (finalPath.length > 0) {
      ctx.beginPath();
      ctx.moveTo(nodes[finalPath[0]].x, nodes[finalPath[0]].y);
      for (let i = 1; i < finalPath.length; i++) {
        ctx.lineTo(nodes[finalPath[i]].x, nodes[finalPath[i]].y);
      }
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  };

  // ----- Beam Search for Pathfinding -----
  const beamSearchPath = () => {
    setAlgorithm('Beam Search (Pathfinding)');
    setMessage('Running Beam Search on Pathfinding...');
    setFinalPath([]);
    setExplorationPaths([]);
    const start = 0;
    const goal = numNodes - 1;
    let beam = [{ path: [start], cost: 0 }];
    let bestSolution = null;

    const stepBeamSearch = () => {
      if (beam.length === 0) {
        if (bestSolution) {
          setFinalPath(bestSolution.path);
          setMessage(`Beam Search (Pathfinding) found a path with cost ${bestSolution.cost.toFixed(2)}`);
        } else {
          setMessage('No path found using Beam Search.');
        }
        return;
      }
      let newBeam = [];
      for (let candidate of beam) {
        const last = candidate.path[candidate.path.length - 1];
        if (last === goal) {
          if (!bestSolution || candidate.cost < bestSolution.cost) {
            bestSolution = candidate;
          }
        } else {
          // Expand via neighbors.
          adjList[last].forEach((neighbor) => {
            if (!candidate.path.includes(neighbor)) {
              const newPath = candidate.path.concat(neighbor);
              const newCost = candidate.cost + distance(nodes[last], nodes[neighbor]);
              newBeam.push({ path: newPath, cost: newCost });
            }
          });
        }
      }
      newBeam.sort((a, b) => {
        const aHeuristic = distance(nodes[a.path[a.path.length - 1]], nodes[goal]);
        const bHeuristic = distance(nodes[b.path[b.path.length - 1]], nodes[goal]);
        return (a.cost + aHeuristic) - (b.cost + bHeuristic);
      });
      beam = newBeam.slice(0, 3); // beam width of 3
      setExplorationPaths(beam.map((candidate) => candidate.path));
      setTimeout(stepBeamSearch, NODE_DELAY);
    };

    stepBeamSearch();
  };

  // ----- A* Search for Pathfinding -----
  const aStarPath = () => {
    setAlgorithm('A* Search (Pathfinding)');
    setMessage('Running A* Search on Pathfinding...');
    setFinalPath([]);
    setExplorationPaths([]);
    const start = 0;
    const goal = numNodes - 1;
    let openSet = [{ path: [start], cost: 0 }];
    let bestSolution = null;

    const stepAStar = () => {
      if (openSet.length === 0) {
        if (bestSolution) {
          setFinalPath(bestSolution.path);
          setMessage(`A* Search (Pathfinding) found a path with cost ${bestSolution.cost.toFixed(2)}`);
        } else {
          setMessage('No path found using A* Search.');
        }
        return;
      }
      openSet.sort(
        (a, b) =>
          (a.cost + distance(nodes[a.path[a.path.length - 1]], nodes[goal])) -
          (b.cost + distance(nodes[b.path[b.path.length - 1]], nodes[goal]))
      );
      let current = openSet.shift();
      setExplorationPaths(openSet.map((candidate) => candidate.path));
      const last = current.path[current.path.length - 1];
      if (last === goal) {
        bestSolution = current;
        setFinalPath(current.path);
        setMessage(`A* Search (Pathfinding) found a path with cost ${current.cost.toFixed(2)}`);
        return;
      }
      adjList[last].forEach((neighbor) => {
        if (!current.path.includes(neighbor)) {
          const newPath = current.path.concat(neighbor);
          const newCost = current.cost + distance(nodes[last], nodes[neighbor]);
          openSet.push({ path: newPath, cost: newCost });
        }
      });
      setTimeout(stepAStar, NODE_DELAY);
    };

    stepAStar();
  };

  return (
    <div>
      <h2>Pathfinding Problem (15 nodes) - {algorithm}</h2>
      <canvas
        ref={canvasRef}
        width={700}
        height={700}
        style={{ border: '1px solid #ccc', marginBottom: '10px' }}
      />
      <div className="controls">
        <button onClick={beamSearchPath}>Run Beam Search</button>
        <button onClick={aStarPath}>Run A* Search</button>
      </div>
      <div>{message}</div>
    </div>
  );
};

export default PathfindingVisualizer;
