package main

import (
	"encoding/xml"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/freddy33/graphml"
	"github.com/gin-gonic/gin"
)

// Допустимые значения для валидации
var (
	validNodeTypes   = map[string]bool{"service": true, "db": true, "cache": true, "queue": true, "external": true}
	validEdgeKinds   = map[string]bool{"sync": true, "async": true, "stream": true}
	validCriticality = map[string]bool{"low": true, "medium": true, "high": true}
)

// Структуры для ответа
type NodeInfo struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Type  string `json:"type"`
}

type EdgeInfo struct {
	ID          string `json:"id"`
	Label       string `json:"label"`
	Source      string `json:"source"`
	Target      string `json:"target"`
	Kind        string `json:"kind"`
	Criticality string `json:"criticality"`
	Pair        string `json:"pair"`
}

type GraphResponse struct {
	Nodes []NodeInfo `json:"nodes"`
	Edges []EdgeInfo `json:"edges"`
}

// Ошибка валидации
type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}

// Структура для принятия GraphML строки
type GraphMLRequest struct {
	GraphML string `json:"graphml" binding:"required"`
}

// Извлекает строковое значение из Data
func getDataValue(data graphml.Data) string {
	reader := data.Reader()
	for {
		token, err := reader.Token()
		if err != nil {
			break
		}
		if charData, ok := token.(xml.CharData); ok {
			return string(charData)
		}
	}
	return ""
}

// Получает значение data по ключу
func getDataByKey(dataList []graphml.Data, key string) string {
	for _, data := range dataList {
		if data.Key == key {
			return getDataValue(data)
		}
	}
	return ""
}

func parseGraphML(reader io.Reader) (*GraphResponse, error) {
	// Парсим GraphML с помощью библиотеки freddy33/graphml
	doc, err := graphml.Decode(reader)
	if err != nil {
		return nil, err
	}

	response := &GraphResponse{
		Nodes: make([]NodeInfo, 0),
		Edges: make([]EdgeInfo, 0),
	}

	// Проходим по всем графам в документе
	for _, graph := range doc.Graphs {
		// Создаем map для проверки существования нод
		nodeExists := make(map[string]bool)

		// Собираем информацию о нодах
		for _, node := range graph.Nodes {
			// Читаем обязательные поля
			label := getDataByKey(node.Data, "n_label")
			nodeType := getDataByKey(node.Data, "n_type")

			// Валидация: label обязателен
			if label == "" {
				return nil, &ValidationError{
					Message: fmt.Sprintf("node '%s': missing required field 'label'", node.ID),
				}
			}

			// Валидация: type обязателен
			if nodeType == "" {
				return nil, &ValidationError{
					Message: fmt.Sprintf("node '%s': missing required field 'type'", node.ID),
				}
			}

			// Валидация: type должен быть из допустимых значений
			if !validNodeTypes[nodeType] {
				return nil, &ValidationError{
					Message: fmt.Sprintf("node '%s': invalid type '%s', must be one of: service, db, cache, queue, external", node.ID, nodeType),
				}
			}

			nodeInfo := NodeInfo{
				ID:    node.ID,
				Label: label,
				Type:  nodeType,
			}

			response.Nodes = append(response.Nodes, nodeInfo)
			nodeExists[node.ID] = true
		}

		// Собираем информацию о рёбрах
		for _, edge := range graph.Edges {
			// Валидация: source узел должен существовать
			if !nodeExists[edge.Source] {
				return nil, &ValidationError{
					Message: fmt.Sprintf("edge '%s': source node '%s' does not exist", edge.ID, edge.Source),
				}
			}

			// Валидация: target узел должен существовать
			if !nodeExists[edge.Target] {
				return nil, &ValidationError{
					Message: fmt.Sprintf("edge '%s': target node '%s' does not exist", edge.ID, edge.Target),
				}
			}

			// Читаем поля
			label := getDataByKey(edge.Data, "e_label")
			kind := getDataByKey(edge.Data, "e_kind")
			criticality := getDataByKey(edge.Data, "e_crit")

			// Валидация: kind обязателен
			if kind == "" {
				return nil, &ValidationError{
					Message: fmt.Sprintf("edge '%s': missing required field 'kind'", edge.ID),
				}
			}

			// Валидация: criticality обязателен
			if criticality == "" {
				return nil, &ValidationError{
					Message: fmt.Sprintf("edge '%s': missing required field 'criticality'", edge.ID),
				}
			}

			// Валидация: kind должен быть из допустимых значений
			if !validEdgeKinds[kind] {
				return nil, &ValidationError{
					Message: fmt.Sprintf("edge '%s': invalid kind '%s', must be one of: sync, async, stream", edge.ID, kind),
				}
			}

			// Валидация: criticality должен быть из допустимых значений
			if !validCriticality[criticality] {
				return nil, &ValidationError{
					Message: fmt.Sprintf("edge '%s': invalid criticality '%s', must be one of: low, medium, high", edge.ID, criticality),
				}
			}

			// Используем label или ID если label не указан
			if label == "" {
				label = edge.ID
			}

			edgeInfo := EdgeInfo{
				ID:          edge.ID,
				Label:       label,
				Source:      edge.Source,
				Target:      edge.Target,
				Kind:        kind,
				Criticality: criticality,
				Pair:        fmt.Sprintf("%s -> %s", edge.Source, edge.Target),
			}

			response.Edges = append(response.Edges, edgeInfo)
		}
	}

	return response, nil
}

func main() {
	// Настраиваем Gin
	r := gin.Default()

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Единственная ручка для парсинга GraphML
	r.POST("/parse", func(c *gin.Context) {
		var req GraphMLRequest

		// Читаем JSON с GraphML строкой
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid request: " + err.Error(),
			})
			return
		}

		// Парсим GraphML строку
		reader := strings.NewReader(req.GraphML)
		graphData, err := parseGraphML(reader)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Failed to parse GraphML: " + err.Error(),
			})
			return
		}

		// Возвращаем JSON с графом
		c.JSON(http.StatusOK, graphData)
	})

	// Запускаем сервер
	log.Println("Starting GraphML Parser API on :8080")
	log.Println("POST /parse - принимает GraphML строку и возвращает JSON граф")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Ошибка запуска сервера: %v", err)
	}
}
