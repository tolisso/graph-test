import {useCallback, useMemo, useState, useEffect} from 'react';
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

// Функция для автоматического расположения узлов
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
    // Фильтры
    const [activeNodeTypes, setActiveNodeTypes] = useState<Set<string>>(new Set(['service', 'db', 'cache', 'queue', 'external']));
    const [activeCriticality, setActiveCriticality] = useState<Set<string>>(new Set(['low', 'medium', 'high']));
    const [activeEnv, setActiveEnv] = useState<Set<string>>(new Set());
    const [activeTags, setActiveTags] = useState<Set<string>>(new Set());

    // Извлекаем уникальные env и tags из данных
    const {allEnvs, allTags} = useMemo(() => {
        const envs = new Set<string>();
        const tags = new Set<string>();

        graphData.nodes.forEach(node => {
            if (node.env) envs.add(node.env);
            node.tags?.forEach(tag => tags.add(tag));
        });

        graphData.edges.forEach(edge => {
            if (edge.env) envs.add(edge.env);
            edge.tags?.forEach(tag => tags.add(tag));
        });

        return {
            allEnvs: Array.from(envs).sort(),
            allTags: Array.from(tags).sort()
        };
    }, [graphData]);

    // Инициализируем фильтры env и tags при первой загрузке
    useMemo(() => {
        if (allEnvs.length > 0 && activeEnv.size === 0) {
            setActiveEnv(new Set(allEnvs));
        }
        if (allTags.length > 0 && activeTags.size === 0) {
            setActiveTags(new Set(allTags));
        }
    }, [allEnvs, allTags]);

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
                    nodeData: node,
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
                // Вычисляем толщину ребра на основе веса
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
                        edgeData: edge,
                    },
                };
            }),
        [graphData.edges]
    );

    // Проверяем, активен ли узел
    const isNodeActive = useCallback((nodeData: any) => {
        // Фильтр по типу
        if (!activeNodeTypes.has(nodeData.type)) return false;

        // Фильтр по env (если есть env фильтры)
        if (allEnvs.length > 0) {
            // Если у узла есть env, проверяем что он в активных
            if (nodeData.env) {
                if (!activeEnv.has(nodeData.env)) return false;
            }
            // Если у узла нет env, но есть хоть один активный env - показываем узел
            // Если все env отключены - скрываем узел без env тоже
            else if (activeEnv.size === 0) {
                return false;
            }
        }

        // Фильтр по tags (если есть tag фильтры)
        if (allTags.length > 0) {
            if (nodeData.tags && nodeData.tags.length > 0) {
                const hasMatchingTag = nodeData.tags.some((tag: string) => activeTags.has(tag));
                if (!hasMatchingTag) return false;
            }
            // Если у узла нет тегов, но все теги отключены - скрываем
            else if (activeTags.size === 0) {
                return false;
            }
        }

        return true;
    }, [activeNodeTypes, activeEnv, activeTags, allEnvs, allTags]);

    // Проверяем, активно ли ребро
    const isEdgeActive = useCallback((edgeData: any, sourceActive: boolean, targetActive: boolean) => {
        // Скрываем ребро если source или target неактивны
        if (!sourceActive || !targetActive) return false;

        // Фильтр по критичности
        if (!activeCriticality.has(edgeData.criticality)) return false;

        // Фильтр по env (если есть env фильтры)
        if (allEnvs.length > 0) {
            if (edgeData.env) {
                if (!activeEnv.has(edgeData.env)) return false;
            } else if (activeEnv.size === 0) {
                return false;
            }
        }

        // Фильтр по tags (если есть tag фильтры)
        if (allTags.length > 0) {
            if (edgeData.tags && edgeData.tags.length > 0) {
                const hasMatchingTag = edgeData.tags.some((tag: string) => activeTags.has(tag));
                if (!hasMatchingTag) return false;
            } else if (activeTags.size === 0) {
                return false;
            }
        }

        return true;
    }, [activeCriticality, activeEnv, activeTags, allEnvs, allTags]);

    // Применяем фильтры как стили (все узлы показаны, но неактивные полупрозрачные)
    const styledNodes = useMemo(() => {
        return initialNodes.map(node => {
            const active = isNodeActive(node.data.nodeData);
            return {
                ...node,
                style: {
                    ...node.style,
                    opacity: active ? 1 : 0.25,
                },
            };
        });
    }, [initialNodes, isNodeActive]);

    const styledEdges = useMemo(() => {
        // Создаем map активности узлов
        const nodeActivityMap = new Map();
        initialNodes.forEach(node => {
            nodeActivityMap.set(node.id, isNodeActive(node.data.nodeData));
        });

        return initialEdges.map(edge => {
            const sourceActive = nodeActivityMap.get(edge.source) ?? true;
            const targetActive = nodeActivityMap.get(edge.target) ?? true;
            const active = isEdgeActive(edge.data.edgeData, sourceActive, targetActive);

            return {
                ...edge,
                style: {
                    ...edge.style,
                    opacity: active ? 1 : 0.25,
                },
                labelStyle: {
                    ...edge.labelStyle,
                    opacity: active ? 1 : 0.25,
                },
            };
        });
    }, [initialEdges, initialNodes, isNodeActive, isEdgeActive]);

    // Считаем активные узлы и рёбра для счётчика
    const {activeNodesCount, activeEdgesCount} = useMemo(() => {
        const activeNodes = styledNodes.filter(n => (n.style?.opacity ?? 1) === 1).length;
        const activeEdges = styledEdges.filter(e => (e.style?.opacity ?? 1) === 1).length;
        return {activeNodesCount: activeNodes, activeEdgesCount: activeEdges};
    }, [styledNodes, styledEdges]);

    const [nodes, setNodes, onNodesChange] = useNodesState(styledNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(styledEdges);

    // Обновляем узлы и рёбра при изменении фильтров
    useEffect(() => {
        setNodes(styledNodes);
    }, [styledNodes, setNodes]);

    useEffect(() => {
        setEdges(styledEdges);
    }, [styledEdges, setEdges]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    // Функции для переключения фильтров
    const toggleNodeType = (type: string) => {
        setActiveNodeTypes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(type)) {
                newSet.delete(type);
            } else {
                newSet.add(type);
            }
            return newSet;
        });
    };

    const toggleCriticality = (crit: string) => {
        setActiveCriticality(prev => {
            const newSet = new Set(prev);
            if (newSet.has(crit)) {
                newSet.delete(crit);
            } else {
                newSet.add(crit);
            }
            return newSet;
        });
    };

    const toggleEnv = (env: string) => {
        setActiveEnv(prev => {
            const newSet = new Set(prev);
            if (newSet.has(env)) {
                newSet.delete(env);
            } else {
                newSet.add(env);
            }
            return newSet;
        });
    };

    const toggleTag = (tag: string) => {
        setActiveTags(prev => {
            const newSet = new Set(prev);
            if (newSet.has(tag)) {
                newSet.delete(tag);
            } else {
                newSet.add(tag);
            }
            return newSet;
        });
    };

    return (
        <div className="graph-visualization">
            <div className="graph-info">
                <div className="info-item">
                    <span className="info-label">Nodes:</span>
                    <span className="info-value">{activeNodesCount} / {graphData.nodes.length}</span>
                </div>
                <div className="info-item">
                    <span className="info-label">Edges:</span>
                    <span className="info-value">{activeEdgesCount} / {graphData.edges.length}</span>
                </div>
            </div>

            <div className="legend">
                <div className="legend-section">
                    <div className="legend-title">Node Types (click to filter)</div>
                    {(['service', 'db', 'cache', 'queue', 'external'] as const).map(type => (
                        <div
                            key={type}
                            className={`legend-item clickable ${!activeNodeTypes.has(type) ? 'inactive' : ''}`}
                            onClick={() => toggleNodeType(type)}
                        >
                            <span className="legend-color" style={{background: getNodeColor(type).bg}}></span>
                            <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                        </div>
                    ))}
                </div>

                <div className="legend-section">
                    <div className="legend-title">Edge Criticality (click to filter)</div>
                    {(['high', 'medium', 'low'] as const).map(crit => {
                        const color = crit === 'high' ? '#f5576c' : crit === 'medium' ? '#ffa726' : '#78909c';
                        return (
                            <div
                                key={crit}
                                className={`legend-item clickable ${!activeCriticality.has(crit) ? 'inactive' : ''}`}
                                onClick={() => toggleCriticality(crit)}
                            >
                                <span className="legend-line" style={{background: color}}></span>
                                <span>{crit.charAt(0).toUpperCase() + crit.slice(1)}{crit === 'high' ? ' (animated)' : ''}</span>
                            </div>
                        );
                    })}
                </div>

                {allEnvs.length > 0 && (
                    <div className="legend-section">
                        <div className="legend-title">Environment</div>
                        {allEnvs.map(env => (
                            <div
                                key={env}
                                className={`legend-item clickable ${!activeEnv.has(env) ? 'inactive' : ''}`}
                                onClick={() => toggleEnv(env)}
                            >
                                <input
                                    type="checkbox"
                                    checked={activeEnv.has(env)}
                                    readOnly
                                />
                                <span>{env}</span>
                            </div>
                        ))}
                    </div>
                )}

                {allTags.length > 0 && (
                    <div className="legend-section">
                        <div className="legend-title">Tags</div>
                        <div className="tags-container">
                            {allTags.map(tag => (
                                <div
                                    key={tag}
                                    className={`tag-chip ${!activeTags.has(tag) ? 'inactive' : ''}`}
                                    onClick={() => toggleTag(tag)}
                                >
                                    {tag}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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
