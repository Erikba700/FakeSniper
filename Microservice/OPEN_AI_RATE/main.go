package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

type OpenAIResponse struct {
	Rate         int    `json:"rate"`
	RateDesc     string `json:"rate_desc"`
	SimilarLinks string `json:"similar_links"`
}

func main() {
	log.Println("Connecting to the database...")
	db, err := sql.Open("mysql", fmt.Sprintf("%s:%s@tcp(%s)/%s",
		os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_HOST"), os.Getenv("DB_NAME")))
	if err != nil {
		log.Fatalf("Database connection error: %v", err)
	}
	defer db.Close()

	for {
		processTargets(db)
		time.Sleep(10 * time.Second)
	}
}

func processTargets(db *sql.DB) {
	log.Println("Querying for targets with status_code 300...")
	rows, err := db.Query("SELECT ID, target, uid, summary FROM fs_targets WHERE status_code = 300")
	if err != nil {
		log.Printf("Failed to query targets: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		var target, uid string
		var summary string
		if err := rows.Scan(&id, &target, &uid, &summary); err != nil {
			log.Printf("Failed to scan target: %v", err)
			continue
		}

		log.Printf("Processing target: ID=%d, Target=%s, UID=%s", id, target, uid)

		// Fetch summaries from fs_se_lists
		seRows, err := db.Query("SELECT summary FROM fs_se_lists WHERE uid = ? AND status_code = 300", uid)
		if err != nil {
			log.Printf("Failed to query fs_se_lists for UID %s: %v", uid, err)
			continue
		}
		defer seRows.Close()

		var seSummaries []string
		for seRows.Next() {
			var seSummary string
			if err := seRows.Scan(&seSummary); err != nil {
				log.Printf("Failed to scan summary from fs_se_lists for UID %s: %v", uid, err)
				continue
			}
			seSummaries = append(seSummaries, seSummary)
		}

		if len(seSummaries) == 0 {
			log.Printf("No valid summaries found in fs_se_lists for UID %s", uid)
			continue
		}

		// Construct the prompt
		prompt := fmt.Sprintf("Here is the main news (News 0):\n%s\n\nHere are other news on the same topic (News 1...News N):\n", summary)
		for i, seSummary := range seSummaries {
			prompt += fmt.Sprintf("News %d: %s\n", i+1, seSummary)
		}
		prompt += "\nYour task:\n1. Compare the content of each news with the main one (News 0).\n2. Determine the semantic discrepancies.\n3. Formulate whether the main news could be unreliable — and why.\n4. Rate the plausibility of the main news on a scale from 0 to 100. Please provide the response in JSON format only: {\"score\":score,\"score_short\":\"A brief explanation of why the score is given\",\"category\":news category}. Ensure that a score and description are always provided, even if the analysis is inconclusive."
		// Send the prompt to the Ollama service
		url := "http://172.29.100.151:11434/api/generate"
		jsonData, err := json.Marshal(map[string]interface{}{
			"model":  "qwen3:32b-q4_K_M",
			"prompt": prompt,
			"stream": false,
		})
		if err != nil {
			log.Printf("Failed to marshal JSON: %v", err)
			continue
		}
		reqBody := bytes.NewBuffer([]byte(jsonData))
		resp, err := http.Post(url, "application/json", reqBody)
		if err != nil {
			log.Printf("Failed to send request to Ollama: %v", err)
			continue
		}
		defer resp.Body.Close()

		// Read and log the response
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			log.Printf("Failed to read response from Ollama: %v", err)
			continue
		}
		var jsonResponse map[string]interface{}
		if err := json.Unmarshal(body, &jsonResponse); err != nil {
			log.Printf("Failed to parse JSON response: %v", err)
			continue
		}
		if score, ok := jsonResponse["score"]; ok {
			if scoreShort, ok := jsonResponse["score_short"]; ok {
				if category, ok := jsonResponse["category"]; ok {
					log.Printf("{\"score\": %v, \"score_short\": \"%v\", \"category\": \"%v\"}", score, scoreShort, category)
				} else {
					log.Printf("{\"score\": 97, \"score_short\": \"AI can't analyze\", \"category\": \"not selected\"}")
				}
			} else {
				log.Printf("{\"score\": 97, \"score_short\": \"AI can't analyze\", \"category\": \"not selected\"}")
			}
		} else {
			log.Printf("{\"score\": 97, \"score_short\": \"AI can't analyze\", \"category\": \"not selected\"}")
		}
	}
}
