import React, { useRef, useState, useEffect } from 'react';
import './TspVisualizer.css';

const TspVisualizer = () => {
  const canvasRef = useRef(null);
  const [cities, setCities] = useState([]);
  // finalPath is the completed tour drawn in red
  const [finalPath, setFinalPath] = useState([]);
  // explorationPaths holds the candidate paths being explored (drawn in blue)
  const [explorationPaths, setExplorationPaths] = useState([]);
  const [algorithm, setAlgorithm] = useState('');
  const [message, setMessage] = useState('');
  const beamWidth = 3;
  const NODE_DELAY = 200; // delay (ms) between animation steps

  // Generate 16 random cities (graph vertices)
  useEffect(() => {
    const generatedCities = [];
    for (let i = 0; i < 8; i++) {
      generatedCities.push({
        x: Math.random() * 500 + 50,
        y: Math.random() * 500 + 50,
      });
    }
    setCities(generatedCities);
  }, []);

  // Redraw canvas whenever cities, finalPath, or explorationPaths change.
  useEffect(() => {
    draw();
  }, [cities, finalPath, explorationPaths]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw cities as small circles with labels.
    cities.forEach((city, index) => {
      ctx.beginPath();
      ctx.arc(city.x, city.y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = 'black';
      ctx.fill();
      ctx.strokeText(index, city.x + 4, city.y + 4);
    });

    // Draw candidate exploration paths (in blue)
    explorationPaths.forEach(path => {
      if (path.length > 0) {
        ctx.beginPath();
        ctx.moveTo(cities[path[0]].x, cities[path[0]].y);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(cities[path[i]].x, cities[path[i]].y);
        }
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // Draw the final complete tour (in red)
    if (finalPath.length > 0) {
      ctx.beginPath();
      ctx.moveTo(cities[finalPath[0]].x, cities[finalPath[0]].y);
      for (let i = 1; i < finalPath.length; i++) {
        ctx.lineTo(cities[finalPath[i]].x, cities[finalPath[i]].y);
      }
      // Close the tour by returning to the starting city.
      ctx.lineTo(cities[finalPath[0]].x, cities[finalPath[0]].y);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  // Euclidean distance between two cities.
  const distance = (a, b) => {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  };

  // ----- Animated Beam Search -----
  const beamSearchTSP = () => {
    setAlgorithm('Beam Search');
    setMessage('Running Beam Search...');
    setFinalPath([]);
    setExplorationPaths([]);

    let initialPath = [0];
    let initialCost = 0;
    let beam = [{ path: initialPath, cost: initialCost }];
    let bestSolution = null;
    const n = cities.length;

    const stepBeamSearch = () => {
      if (beam.length === 0) {
        if (bestSolution) {
          setFinalPath(bestSolution.path);
          setMessage(`Beam Search found a tour with cost ${bestSolution.cost.toFixed(2)}`);
        } else {
          setMessage('No solution found using Beam Search.');
        }
        return;
      }
      let newBeam = [];
      for (let candidate of beam) {
        if (candidate.path.length === n) {
          // Completed a tour: add cost to return to the starting city.
          candidate.cost += distance(cities[candidate.path[candidate.path.length - 1]], cities[0]);
          if (!bestSolution || candidate.cost < bestSolution.cost) {
            bestSolution = candidate;
          }
        } else {
          // Expand candidate by appending every unvisited city.
          for (let i = 0; i < n; i++) {
            if (!candidate.path.includes(i)) {
              const newPath = candidate.path.concat(i);
              const newCost =
                candidate.cost + distance(cities[candidate.path[candidate.path.length - 1]], cities[i]);
              newBeam.push({ path: newPath, cost: newCost });
            }
          }
        }
      }
      // Sort new beam candidates based on current cost plus a simple heuristic (distance to start).
      newBeam.sort((a, b) => {
        const aHeuristic = distance(cities[a.path[a.path.length - 1]], cities[0]);
        const bHeuristic = distance(cities[b.path[b.path.length - 1]], cities[0]);
        return (a.cost + aHeuristic) - (b.cost + bHeuristic);
      });
      beam = newBeam.slice(0, beamWidth);

      // Update the explorationPaths state to visualize candidate paths.
      setExplorationPaths(beam.map(candidate => candidate.path));
      setTimeout(stepBeamSearch, NODE_DELAY);
    };

    stepBeamSearch();
  };

  // ----- Animated A* Search -----
  const aStarTSP = () => {
    setAlgorithm('A* Search');
    setMessage('Running A* Search...');
    setFinalPath([]);
    setExplorationPaths([]);
    const n = cities.length;
    let openSet = [{ path: [0], cost: 0 }];
    let bestSolution = null;

    const stepAStar = () => {
      if (openSet.length === 0) {
        if (bestSolution) {
          setFinalPath(bestSolution.path);
          setMessage(`A* Search found a tour with cost ${bestSolution.cost.toFixed(2)}`);
        } else {
          setMessage('No solution found using A* Search.');
        }
        return;
      }
      // Sort openSet based on (cost + improvedHeuristic)
      openSet.sort((a, b) => {
        return (a.cost + improvedHeuristic(a.path)) - (b.cost + improvedHeuristic(b.path));
      });
      let current = openSet.shift();

      // Update visualization: show remaining candidate paths.
      setExplorationPaths(openSet.map(candidate => candidate.path));

      if (current.path.length === n) {
        // Completed a tour – add cost to return to start.
        current.cost += distance(cities[current.path[current.path.length - 1]], cities[0]);
        bestSolution = current;
        setFinalPath(current.path);
        setMessage(`A* Search found a tour with cost ${current.cost.toFixed(2)}`);
        return;
      }
      // Expand the current node.
      for (let i = 0; i < n; i++) {
        if (!current.path.includes(i)) {
          const newPath = current.path.concat(i);
          const newCost =
            current.cost + distance(cities[current.path[current.path.length - 1]], cities[i]);
          openSet.push({ path: newPath, cost: newCost });
        }
      }

      setTimeout(stepAStar, NODE_DELAY);
    };

    stepAStar();
  };

  // Improved heuristic using MST lower bound:
  // Computes the cost of the Minimum Spanning Tree (MST) over unvisited nodes,
  // then adds the minimum distance from the last node in the path to any unvisited node,
  // and the minimum distance from the start city.
  const improvedHeuristic = (path) => {
    const n = cities.length;
    const unvisited = [];
    for (let i = 0; i < n; i++) {
      if (!path.includes(i)) {
        unvisited.push(i);
      }
    }
    if (unvisited.length === 0) return 0;
    const lastCity = cities[path[path.length - 1]];
    const mstCost = computeMST(unvisited);
    const minToUnvisited = Math.min(...unvisited.map(i => distance(lastCity, cities[i])));
    const minFromStart = Math.min(...unvisited.map(i => distance(cities[0], cities[i])));
    return mstCost + minToUnvisited + minFromStart;
  };

  // Computes the MST cost using Prim’s algorithm over the given node indices.
  const computeMST = (indices) => {
    if (indices.length === 0) return 0;
    const inMST = new Set();
    inMST.add(indices[0]);
    let mstCost = 0;
    const remaining = new Set(indices.slice(1));

    while (remaining.size > 0) {
      let minEdge = Infinity;
      let nextNode = null;
      for (let i of inMST) {
        for (let j of remaining) {
          const d = distance(cities[i], cities[j]);
          if (d < minEdge) {
            minEdge = d;
            nextNode = j;
          }
        }
      }
      if (nextNode === null) break;
      mstCost += minEdge;
      inMST.add(nextNode);
      remaining.delete(nextNode);
    }
    return mstCost;
  };

  return (
    <div>
      <h2>TSP Pathfinding ({algorithm})</h2>
      <canvas
        ref={canvasRef}
        width={700}
        height={700}
        style={{ border: '1px solid #ccc' }}
      />
      <div className="controls">
        <button onClick={beamSearchTSP}>Run Beam Search</button>
        <button onClick={aStarTSP}>Run A* Search</button>
      </div>
      <div>{message}</div>
    </div>
  );
};

export default TspVisualizer;
