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

// Структуры для ответа
type NodeInfo struct {
	ID    string `json:"id"`
	Label string `json:"label"`
}

type EdgeInfo struct {
	ID     string `json:"id"`
	Label  string `json:"label"`
	Source string `json:"source"`
	Target string `json:"target"`
	Pair   string `json:"pair"`
}

type GraphResponse struct {
	Nodes []NodeInfo `json:"nodes"`
	Edges []EdgeInfo `json:"edges"`
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
		// Собираем информацию о нодах
		for _, node := range graph.Nodes {
			nodeInfo := NodeInfo{
				ID: node.ID,
			}

			// Ищем label в данных ноды
			label := getDataByKey(node.Data, "n_label")
			if label != "" {
				nodeInfo.Label = label
			} else {
				// Если label не найден, используем ID
				nodeInfo.Label = node.ID
			}

			response.Nodes = append(response.Nodes, nodeInfo)
		}

		// Собираем информацию о рёбрах
		for _, edge := range graph.Edges {
			edgeInfo := EdgeInfo{
				ID:     edge.ID,
				Source: edge.Source,
				Target: edge.Target,
				Pair:   fmt.Sprintf("%s -> %s", edge.Source, edge.Target),
			}

			// Ищем label в данных ребра
			label := getDataByKey(edge.Data, "e_label")
			if label != "" {
				edgeInfo.Label = label
			} else {
				// Если label не найден, используем ID
				edgeInfo.Label = edge.ID
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
