package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

type NewsRequest struct {
	Title    string   `json:"title"`
	Keywords []string `json:"keywords"`
}

type NewsResponse struct {
	Count int           `json:"count"`
	Data  []NewsArticle `json:"data"`
}

type NewsArticle struct {
	Title     string `json:"title"`
	URL       string `json:"url"`
	ShortDesc string `json:"short_desc"`
	PostDate  string `json:"post_date"`
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
	log.Println("Querying for targets with status_code 200...")
	rows, err := db.Query("SELECT ID, title, target, uid FROM fs_targets WHERE status_code = 200")
	if err != nil {
		log.Printf("Failed to query targets: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		var title, target, uid string
		if err := rows.Scan(&id, &title, &target, &uid); err != nil {
			log.Printf("Failed to scan target: %v", err)
			continue
		}

		log.Printf("Processing target: ID=%d, Title=%s, Target=%s, UID=%s", id, title, target, uid)
		// Update the status_code in fs_targets to 300 immediately after making a request to SerpAPI
		_, err = db.Exec("UPDATE fs_targets SET status_code = 300 WHERE uid = ?", uid)
		if err != nil {
			log.Printf("Failed to update status_code for target UID %s: %v", uid, err)
		}

		articles, err := searchGoogle(title)
		if err != nil {
			log.Printf("Failed to search Google for title %s: %v", title, err)
			continue
		}

		for _, article := range articles {
			_, err := db.Exec("INSERT INTO fs_se_lists (TID, target, create_date, status_code, uid) VALUES (?, ?, ?, ?, ?)",
				id, article.URL, time.Now().Unix(), 200, uid)
			if err != nil {
				log.Printf("Failed to insert article into fs_se_lists: %v", err)
			}
		}

		// Update the status_code in fs_targets to 300 after processing
		_, err = db.Exec("UPDATE fs_targets SET status_code = 300 WHERE uid = ?", uid)
		if err != nil {
			log.Printf("Failed to update status_code for target ID %d: %v", id, err)
		}
	}
}

func searchGoogle(query string) ([]NewsArticle, error) {
	apiKey := os.Getenv("API_KEY")
	searchURL := fmt.Sprintf("https://serpapi.com/search.json?q=%s&api_key=%s", url.QueryEscape(query), apiKey)

	fmt.Printf("Sending request to URL: %s\n", searchURL)
	res, err := http.Get(searchURL)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode != 200 {
		fmt.Printf("Failed to fetch search results from URL: %s\n", searchURL)
		return nil, fmt.Errorf("failed to fetch search results: %s", res.Status)
	}

	var searchResults struct {
		OrganicResults []struct {
			Title string `json:"title"`
			Link  string `json:"link"`
		} `json:"organic_results"`
	}

	if err := json.NewDecoder(res.Body).Decode(&searchResults); err != nil {
		return nil, err
	}

	var articles []NewsArticle
	for _, item := range searchResults.OrganicResults {
		articles = append(articles, NewsArticle{
			Title:     item.Title,
			URL:       item.Link,
			ShortDesc: "",
			PostDate:  time.Now().Format("2006-01-02"),
		})
	}

	return articles, nil
}
