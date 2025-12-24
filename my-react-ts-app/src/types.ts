// Типы для GraphML данных
export interface NodeInfo {
  id: string;
  label: string;
  type: string;
  x?: number;
  y?: number;
}

export interface EdgeInfo {
  id: string;
  label: string;
  source: string;
  target: string;
  kind: string;
  criticality: string;
  weight?: number;
  pair: string;
}

export interface GraphData {
  nodes: NodeInfo[];
  edges: EdgeInfo[];
}
