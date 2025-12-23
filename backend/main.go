package main

import (
	"encoding/json"
	"encoding/xml"
	"fmt"
	"log"
	"net/http"
	"os"

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

func parseGraphML(filename string) (*GraphResponse, error) {
	// Открываем файл
	file, err := os.Open(filename)
	if err != nil {
		return nil, fmt.Errorf("ошибка открытия файла: %v", err)
	}
	defer file.Close()

	// Парсим GraphML с помощью библиотеки freddy33/graphml
	doc, err := graphml.Decode(file)
	if err != nil {
		return nil, fmt.Errorf("ошибка парсинга GraphML: %v", err)
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
	// Парсим GraphML файл при запуске
	graphData, err := parseGraphML("sample.graphml")
	if err != nil {
		log.Fatalf("Ошибка парсинга GraphML: %v", err)
	}

	// Выводим данные в консоль
	fmt.Println("=== NODES ===")
	fmt.Printf("Всего нод: %d\n\n", len(graphData.Nodes))
	for i, node := range graphData.Nodes {
		fmt.Printf("%d. ID: %s, Label: %s\n", i+1, node.ID, node.Label)
	}

	fmt.Println("\n=== EDGES ===")
	fmt.Printf("Всего рёбер: %d\n\n", len(graphData.Edges))
	for i, edge := range graphData.Edges {
		fmt.Printf("%d. ID: %s, Label: %s, Pair: %s\n", i+1, edge.ID, edge.Label, edge.Pair)
	}

	// Выводим JSON для удобства
	fmt.Println("\n=== JSON OUTPUT ===")
	jsonData, _ := json.MarshalIndent(graphData, "", "  ")
	fmt.Println(string(jsonData))

	// Настраиваем Gin
	r := gin.Default()

	// API endpoint для получения данных графа
	r.GET("/graph", func(c *gin.Context) {
		c.JSON(http.StatusOK, graphData)
	})

	// API endpoint для получения только нод
	r.GET("/nodes", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"nodes": graphData.Nodes,
			"count": len(graphData.Nodes),
		})
	})

	// API endpoint для получения только рёбер
	r.GET("/edges", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"edges": graphData.Edges,
			"count": len(graphData.Edges),
		})
	})

	// Корневой маршрут
	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "GraphML Parser API",
			"endpoints": []string{
				"GET /graph - получить весь граф",
				"GET /nodes - получить только ноды",
				"GET /edges - получить только рёбра",
			},
		})
	})

	// Запускаем сервер
	fmt.Println("\n=== Starting Gin server on :8080 ===")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Ошибка запуска сервера: %v", err)
	}
}
