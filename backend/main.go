package main

import (
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GraphML структуры для парсинга XML
type GraphML struct {
	XMLName xml.Name `xml:"graphml"`
	Graph   Graph    `xml:"graph"`
}

type Graph struct {
	Nodes []Node `xml:"node"`
	Edges []Edge `xml:"edge"`
}

type Node struct {
	ID   string `xml:"id,attr"`
	Data []Data `xml:"data"`
}

type Edge struct {
	ID     string `xml:"id,attr"`
	Source string `xml:"source,attr"`
	Target string `xml:"target,attr"`
	Data   []Data `xml:"data"`
}

type Data struct {
	Key   string `xml:"key,attr"`
	Value string `xml:",chardata"`
}

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

func parseGraphML(filename string) (*GraphResponse, error) {
	// Читаем файл
	xmlFile, err := ioutil.ReadFile(filename)
	if err != nil {
		return nil, fmt.Errorf("ошибка чтения файла: %v", err)
	}

	// Парсим XML
	var graphML GraphML
	err = xml.Unmarshal(xmlFile, &graphML)
	if err != nil {
		return nil, fmt.Errorf("ошибка парсинга XML: %v", err)
	}

	response := &GraphResponse{
		Nodes: make([]NodeInfo, 0),
		Edges: make([]EdgeInfo, 0),
	}

	// Собираем информацию о нодах
	for _, node := range graphML.Graph.Nodes {
		nodeInfo := NodeInfo{
			ID: node.ID,
		}

		// Ищем label в данных ноды
		for _, data := range node.Data {
			if data.Key == "n_label" {
				nodeInfo.Label = data.Value
				break
			}
		}

		// Если label не найден, используем ID
		if nodeInfo.Label == "" {
			nodeInfo.Label = node.ID
		}

		response.Nodes = append(response.Nodes, nodeInfo)
	}

	// Собираем информацию о рёбрах
	for _, edge := range graphML.Graph.Edges {
		edgeInfo := EdgeInfo{
			ID:     edge.ID,
			Source: edge.Source,
			Target: edge.Target,
			Pair:   fmt.Sprintf("%s -> %s", edge.Source, edge.Target),
		}

		// Ищем label в данных ребра
		for _, data := range edge.Data {
			if data.Key == "e_label" {
				edgeInfo.Label = data.Value
				break
			}
		}

		// Если label не найден, используем ID
		if edgeInfo.Label == "" {
			edgeInfo.Label = edge.ID
		}

		response.Edges = append(response.Edges, edgeInfo)
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
