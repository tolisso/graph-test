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

// Функция для автоматического расположения узлов
const getLayoutedNodes = (nodes: Node[]): Node[] => {
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
        const nodes = graphData.nodes.map((node) => ({
            id: node.id,
            type: 'default',
            data: {label: node.label},
            position: {x: 0, y: 0},
            style: {
                background: '#667eea',
                color: 'white',
                border: '2px solid #764ba2',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '14px',
                fontWeight: '500',
            },
        }));

        return getLayoutedNodes(nodes);
    }, [graphData.nodes]);

    const initialEdges: Edge[] = useMemo(
        () =>
            graphData.edges.map((edge) => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                label: edge.label,
                type: 'smoothstep',
                animated: true,
                style: {stroke: '#667eea', strokeWidth: 2},
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#667eea',
                },
                labelStyle: {
                    fill: '#4a5568',
                    fontWeight: 500,
                    fontSize: '12px',
                },
                labelBgStyle: {
                    fill: 'white',
                    fillOpacity: 0.9,
                },
            })),
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
