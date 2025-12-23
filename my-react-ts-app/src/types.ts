// Типы для GraphML данных
export interface NodeInfo {
  id: string;
  label: string;
}

export interface EdgeInfo {
  id: string;
  label: string;
  source: string;
  target: string;
  pair: string;
}

export interface GraphData {
  nodes: NodeInfo[];
  edges: EdgeInfo[];
}
