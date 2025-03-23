// App.jsx
import React, { useState } from 'react';
import MazeSolver from './MazeSolver';
import TspVisualizer from './TspVisualizer';
import PathfindingVisualizer from './PathfindingVisualizer';

function App() {
  // Change view to 'maze', 'tsp', or 'pathfinding'
  const [view, setView] = useState('maze');

  return (
    <div>
      <header>
        <h1>Search Algorithms Visualization</h1>
        <nav>
          <button onClick={() => setView('maze')}>Maze Solver</button>
          <button onClick={() => setView('tsp')}>TSP Problem</button>
          <button onClick={() => setView('pathfinding')}>Pathfinding Problem</button>
        </nav>
      </header>
      <main>
        {view === 'maze' && <MazeSolver />}
        {view === 'tsp' && <TspVisualizer />}
        {view === 'pathfinding' && <PathfindingVisualizer />}
      </main>
    </div>
  );
}

export default App;
