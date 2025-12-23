import { useState } from 'react';
import { FileUploader } from './components/FileUploader';
import { GraphVisualization } from './components/GraphVisualization';
import type {GraphData} from './types';
import './App.css';

function App() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);

  const handleGraphLoaded = (data: GraphData) => {
    setGraphData(data);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>GraphML Visualizer</h1>
        <p>Upload a GraphML file to visualize your graph</p>
      </header>

      <FileUploader onGraphLoaded={handleGraphLoaded} />

      {graphData && <GraphVisualization graphData={graphData} />}

      {!graphData && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h2>No graph loaded</h2>
          <p>Upload a GraphML file to get started</p>
        </div>
      )}
    </div>
  );
}

export default App;
