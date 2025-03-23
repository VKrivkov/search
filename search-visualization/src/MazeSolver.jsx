import React, { useState } from 'react';
import './MazeSolver.css';

const MAZE_ROWS = 50;
const MAZE_COLS = 50;
const NODE_DELAY = 0; // set to 0 (or increase to see visible pacing)

// Generate a maze with a solid outer border of walls,
// except for a single exit in the bottom border.
const generateMaze = (rows, cols, wallProbability = 0.3) => {
  const maze = [];
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      // Force the outer border to be walls
      if (i === 0 || i === rows - 1 || j === 0 || j === cols - 1) {
        row.push(1);
      } else {
        row.push(Math.random() < wallProbability ? 1 : 0);
      }
    }
    maze.push(row);
  }
  // Create one exit on the bottom border (center)
  const exitCol = Math.floor(cols / 2);
  maze[rows - 1][exitCol] = 0;
  return maze;
};

const start = { row: 1, col: 1 };
const goal = { row: MAZE_ROWS - 1, col: Math.floor(MAZE_COLS / 2) };

const nodeToString = (node) => `${node.row}-${node.col}`;

// Get valid neighbors (up, down, left, right) that are open (0)
const getNeighbors = (node, maze) => {
  const { row, col } = node;
  const neighbors = [];
  const directions = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];
  for (const d of directions) {
    const newRow = row + d.row;
    const newCol = col + d.col;
    if (
      newRow >= 0 &&
      newRow < maze.length &&
      newCol >= 0 &&
      newCol < maze[0].length &&
      maze[newRow][newCol] === 0
    ) {
      neighbors.push({ row: newRow, col: newCol });
    }
  }
  return neighbors;
};

const MazeSolver = () => {
  const [maze] = useState(generateMaze(MAZE_ROWS, MAZE_COLS, 0.3));
  const [visitedCells, setVisitedCells] = useState([]);
  const [path, setPath] = useState([]);
  const [algorithm, setAlgorithm] = useState('');
  const [message, setMessage] = useState('');

  // --------------------
  // Asynchronous BFS (unchanged)
  // --------------------
  const runBFS = () => {
    setAlgorithm('BFS');
    setVisitedCells([]);
    setPath([]);
    setMessage('Running BFS...');
    const queue = [start];
    const visited = new Set();
    const cameFrom = {};
    visited.add(nodeToString(start));

    const stepBFS = () => {
      if (queue.length === 0) {
        setMessage('No path found using BFS');
        return;
      }
      const current = queue.shift();
      setVisitedCells((prev) => Array.from(new Set([...prev, nodeToString(current)])));
      if (current.row === goal.row && current.col === goal.col) {
        // Reconstruct path
        const pathFound = [];
        let curr = goal;
        while (nodeToString(curr) !== nodeToString(start)) {
          pathFound.push(curr);
          curr = cameFrom[nodeToString(curr)];
        }
        pathFound.push(start);
        pathFound.reverse();
        setPath(pathFound);
        setMessage('Path found using BFS');
        return;
      }
      const neighbors = getNeighbors(current, maze);
      for (const neighbor of neighbors) {
        const key = nodeToString(neighbor);
        if (!visited.has(key)) {
          visited.add(key);
          cameFrom[key] = current;
          queue.push(neighbor);
        }
      }
      setTimeout(stepBFS, NODE_DELAY);
    };

    stepBFS();
  };

  // --------------------
  // Asynchronous DFS (normal DFS using a stack)
  // --------------------
  const runDFS = () => {
    setAlgorithm('DFS');
    setVisitedCells([]);
    setPath([]);
    setMessage('Running DFS...');
    // Each stack item contains: { node, path }
    const stack = [{ node: start, path: [start] }];
    const visited = new Set();
    visited.add(nodeToString(start));

    const stepDFS = () => {
      if (stack.length === 0) {
        setMessage('No path found using DFS');
        return;
      }
      const current = stack.pop();
      setVisitedCells((prev) => Array.from(new Set([...prev, nodeToString(current.node)])));
      if (current.node.row === goal.row && current.node.col === goal.col) {
        setPath(current.path);
        setMessage('Path found using DFS');
        return;
      }
      const neighbors = getNeighbors(current.node, maze);
      // Push neighbors in reverse order for DFS order (optional)
      for (let i = neighbors.length - 1; i >= 0; i--) {
        const neighbor = neighbors[i];
        const key = nodeToString(neighbor);
        if (!visited.has(key)) {
          visited.add(key);
          stack.push({
            node: neighbor,
            path: [...current.path, neighbor],
          });
        }
      }
      setTimeout(stepDFS, NODE_DELAY);
    };

    stepDFS();
  };

  return (
    <div>
      <h2>Maze Solver ({algorithm})</h2>
      <div className="maze-grid">
        {maze.map((row, i) =>
          row.map((cell, j) => {
            let cellClass = 'cell';
            if (cell === 1) cellClass += ' wall';
            const key = `${i}-${j}`;
            if (i === start.row && j === start.col) cellClass += ' start';
            if (i === goal.row && j === goal.col) cellClass += ' goal';
            if (visitedCells.includes(key)) cellClass += ' visited';
            if (path.some((n) => n.row === i && n.col === j)) cellClass += ' path';
            return <div key={key} className={cellClass}></div>;
          })
        )}
      </div>
      <div className="controls">
        <button onClick={runBFS}>Run BFS</button>
        <button onClick={runDFS}>Run DFS</button>
      </div>
      <div>{message}</div>
    </div>
  );
};

export default MazeSolver;
