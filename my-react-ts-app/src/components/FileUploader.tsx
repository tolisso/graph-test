import { useState } from 'react';
import type {GraphData} from '../types';
import './FileUploader.css';

interface FileUploaderProps {
  onGraphLoaded: (graph: GraphData) => void;
}

export const FileUploader = ({ onGraphLoaded }: FileUploaderProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setError(null);

    try {
      // Читаем содержимое файла
      const text = await file.text();

      // Отправляем на бэкенд
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ graphml: text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse GraphML');
      }

      const graphData: GraphData = await response.json();
      onGraphLoaded(graphData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error parsing GraphML:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="file-uploader">
      <div className="upload-container">
        <label htmlFor="file-input" className="file-label">
          <span className="upload-icon">📁</span>
          <span className="upload-text">
            {fileName ? fileName : 'Choose GraphML file'}
          </span>
        </label>
        <input
          id="file-input"
          type="file"
          accept=".graphml,.xml"
          onChange={handleFileChange}
          disabled={loading}
          className="file-input"
        />
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <span>Parsing GraphML...</span>
        </div>
      )}

      {error && (
        <div className="error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
