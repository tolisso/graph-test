import {useCallback, useMemo} from 'react';
import ReactFlow, {
    type Node,
    type Edge,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    type Connection,
    MarkerType,
    BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type {GraphData} from '../types';
import './GraphVisualization.css';

interface GraphVisualizationProps {
    graphData: GraphData;
}

// Цвета для разных типов узлов
const getNodeColor = (type: string): {bg: string, border: string} => {
    switch (type) {
        case 'service':
            return {bg: '#667eea', border: '#764ba2'};
        case 'db':
            return {bg: '#f093fb', border: '#f5576c'};
        case 'cache':
            return {bg: '#4facfe', border: '#00f2fe'};
        case 'queue':
            return {bg: '#43e97b', border: '#38f9d7'};
        case 'external':
            return {bg: '#fa709a', border: '#fee140'};
        default:
            return {bg: '#667eea', border: '#764ba2'};
    }
};

// Функция для автоматического расположения узлов (force-directed simulation)
const getAutoLayoutNodes = (nodes: Node[]): Node[] => {
    const nodeCount = nodes.length;
    const radius = Math.max(200, nodeCount * 30);
    const angleStep = (2 * Math.PI) / nodeCount;

    return nodes.map((node, index) => {
        const angle = index * angleStep;
        const x = Math.cos(angle) * radius + 400;
        const y = Math.sin(angle) * radius + 300;

        return {
            ...node,
            position: {x, y},
        };
    });
};

export const GraphVisualization = ({graphData}: GraphVisualizationProps) => {
    // Преобразуем данные графа в формат React Flow
    const initialNodes: Node[] = useMemo(() => {
        const nodes = graphData.nodes.map((node) => {
            const colors = getNodeColor(node.type);

            return {
                id: node.id,
                type: 'default',
                data: {
                    label: (
                        <div>
                            <div style={{fontWeight: 600}}>{node.label}</div>
                            <div style={{fontSize: '10px', opacity: 0.8, marginTop: '2px'}}>
                                {node.type}
                            </div>
                        </div>
                    ),
                },
                position: {
                    x: node.x ?? 0,
                    y: node.y ?? 0,
                },
                style: {
                    background: colors.bg,
                    color: 'white',
                    border: `2px solid ${colors.border}`,
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    minWidth: '120px',
                },
            };
        });

        // Проверяем, есть ли хотя бы у одного узла координаты
        const hasCoordinates = nodes.some(n => n.position.x !== 0 || n.position.y !== 0);

        // Если координат нет - применяем auto layout
        if (!hasCoordinates) {
            return getAutoLayoutNodes(nodes);
        }

        return nodes;
    }, [graphData.nodes]);

    const initialEdges: Edge[] = useMemo(
        () =>
            graphData.edges.map((edge) => {
                // Вычисляем толщину ребра на основе веса (по умолчанию 2)
                const strokeWidth = edge.weight ? Math.max(1, Math.min(10, edge.weight)) : 2;

                // Цвет и анимация на основе критичности
                let color = '#667eea';
                let animated = false;

                switch (edge.criticality) {
                    case 'high':
                        color = '#f5576c';
                        animated = true;
                        break;
                    case 'medium':
                        color = '#ffa726';
                        animated = false;
                        break;
                    case 'low':
                        color = '#78909c';
                        animated = false;
                        break;
                }

                return {
                    id: edge.id,
                    source: edge.source,
                    target: edge.target,
                    label: edge.label,
                    type: 'default',
                    animated: animated,
                    style: {stroke: color, strokeWidth: strokeWidth},
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: color,
                    },
                    labelStyle: {
                        fill: '#4a5568',
                        fontWeight: 500,
                        fontSize: '11px',
                    },
                    labelBgStyle: {
                        fill: 'white',
                        fillOpacity: 0.95,
                    },
                    data: {
                        kind: edge.kind,
                        criticality: edge.criticality,
                    },
                };
            }),
        [graphData.edges]
    );

    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    return (
        <div className="graph-visualization">
            <div className="graph-info">
                <div className="info-item">
                    <span className="info-label">Nodes:</span>
                    <span className="info-value">{graphData.nodes.length}</span>
                </div>
                <div className="info-item">
                    <span className="info-label">Edges:</span>
                    <span className="info-value">{graphData.edges.length}</span>
                </div>
            </div>

            <div className="legend">
                <div className="legend-section">
                    <div className="legend-title">Node Types</div>
                    <div className="legend-item">
                        <span className="legend-color" style={{background: '#667eea'}}></span>
                        <span>Service</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-color" style={{background: '#f093fb'}}></span>
                        <span>Database</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-color" style={{background: '#4facfe'}}></span>
                        <span>Cache</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-color" style={{background: '#43e97b'}}></span>
                        <span>Queue</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-color" style={{background: '#fa709a'}}></span>
                        <span>External</span>
                    </div>
                </div>
                <div className="legend-section">
                    <div className="legend-title">Edge Criticality</div>
                    <div className="legend-item">
                        <span className="legend-line" style={{background: '#f5576c'}}></span>
                        <span>High (animated)</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-line" style={{background: '#ffa726'}}></span>
                        <span>Medium</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-line" style={{background: '#78909c'}}></span>
                        <span>Low</span>
                    </div>
                </div>
            </div>

            <div className="flow-container">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    fitView
                    attributionPosition="bottom-left"
                >
                    <Controls/>
                    <Background variant={BackgroundVariant.Dots} gap={12} size={1}/>
                </ReactFlow>
            </div>
        </div>
    );
};
