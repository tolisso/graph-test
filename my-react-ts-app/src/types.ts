// Типы для GraphML данных
export interface NodeInfo {
  id: string;
  label: string;
  type: string;
  x?: number;
  y?: number;
  env?: string;
  tags?: string[];
}

export interface EdgeInfo {
  id: string;
  label: string;
  source: string;
  target: string;
  kind: string;
  criticality: string;
  weight?: number;
  env?: string;
  tags?: string[];
  pair: string;
}

export interface GraphData {
  nodes: NodeInfo[];
  edges: EdgeInfo[];
}

export interface Filters {
  nodeTypes: Set<string>;
  criticality: Set<string>;
  env: Set<string>;
  tags: Set<string>;
}
