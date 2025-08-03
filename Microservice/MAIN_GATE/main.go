package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/google/uuid"
)

type TargetRequest struct {
	TargetURL string `json:"target_url"`
}

func checkCredentialsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	uid := r.URL.Query().Get("uid")
	if uid == "" {
		http.Error(w, "UID is required", http.StatusBadRequest)
		return
	}

	db, err := sql.Open("mysql", fmt.Sprintf("%s:%s@tcp(%s)/%s",
		os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_HOST"), os.Getenv("DB_NAME")))
	if err != nil {
		http.Error(w, "Database connection error", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	var title, keywords, summary string
	var image sql.NullString
	query := "SELECT title, keywords, summary, image FROM fs_targets WHERE uid = ?"
	err = db.QueryRow(query, uid).Scan(&title, &keywords, &summary, &image)
	if err != nil {
		if err == sql.ErrNoRows {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "No record found"})
		} else {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to retrieve record"})
		}
		return
	}

	if title == "" || keywords == "" || summary == "" {
		w.WriteHeader(http.StatusResetContent)
		w.Write([]byte(`{"status": 205, "message": "Try again check"}`))
		return
	}

	response := map[string]interface{}{
		"title":    title,
		"keywords": keywords,
		"summary":  summary,
		"image":    image.String,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func getHistoryHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	page := 1
	if p, ok := r.URL.Query()["page"]; ok && len(p) > 0 {
		fmt.Sscanf(p[0], "%d", &page)
	}

	db, err := sql.Open("mysql", fmt.Sprintf("%s:%s@tcp(%s)/%s",
		os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_HOST"), os.Getenv("DB_NAME")))
	if err != nil {
		http.Error(w, "Database connection error", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	offset := (page - 1) * 10
	query := "SELECT target AS title, keywords, uid, create_date, status_code, summary, image FROM fs_targets ORDER BY create_date DESC LIMIT 10 OFFSET ?"
	rows, err := db.Query(query, offset)
	if err != nil {
		http.Error(w, "Failed to retrieve records", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var history []map[string]interface{}
	for rows.Next() {
		var title, uid string
		var image sql.NullString
		var summary sql.NullString
		var keywords sql.NullString
		var createDate int64
		var statusCode int
		if err := rows.Scan(&title, &keywords, &uid, &createDate, &statusCode, &summary, &image); err != nil {
			log.Printf("Error scanning record: %v", err)
			http.Error(w, "Failed to scan record", http.StatusInternalServerError)
			return
			http.Error(w, "Failed to scan record", http.StatusInternalServerError)
			return
		}
		history = append(history, map[string]interface{}{
			"title":       title,
			"keywords":    keywords.String,
			"uid":         uid,
			"create_date": createDate,
			"status_code": statusCode,
			"summary":     summary.String,
			"image":       image.String,
		})
	}

	var totalRecords int
	err = db.QueryRow("SELECT COUNT(*) FROM fs_targets").Scan(&totalRecords)
	if err != nil {
		http.Error(w, "Failed to count records", http.StatusInternalServerError)
		return
	}

	totalPages := (totalRecords + 9) / 10

	response := map[string]interface{}{
		"history":     history,
		"total_pages": totalPages,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

type TargetResponse struct {
	UID    string `json:"uid"`
	Status string `json:"status"`
}

func getSimilarNews(w http.ResponseWriter, r *http.Request) {
	uid := r.URL.Query().Get("uid")
	if uid == "" {
		http.Error(w, "Missing uid parameter", http.StatusBadRequest)
		return
	}

	db, err := sql.Open("mysql", fmt.Sprintf("%s:%s@tcp(%s)/%s",
		os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_HOST"), os.Getenv("DB_NAME")))
	if err != nil {
		http.Error(w, "Database connection error", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	var statusCode200Exists bool
	err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM fs_se_lists WHERE uid = ? AND status_code = 200)", uid).Scan(&statusCode200Exists)
	if err != nil {
		http.Error(w, "Database query error", http.StatusInternalServerError)
		return
	}

	rows, err := db.Query("SELECT target, title FROM fs_se_lists WHERE uid = ? AND status_code = 300", uid)
	if err != nil {
		http.Error(w, "Database query error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var results []map[string]string
	for rows.Next() {
		var target, title string
		if err := rows.Scan(&target, &title); err != nil {
			http.Error(w, "Database scan error", http.StatusInternalServerError)
			return
		}
		results = append(results, map[string]string{"target": target, "title": title})
	}

	w.Header().Set("Content-Type", "application/json")
	if statusCode200Exists {
		if len(results) == 0 {
			http.Error(w, "No data found for status 300", http.StatusNotFound)
			return
		}
		json.NewEncoder(w).Encode(map[string]interface{}{"status": 300, "data": results})
	} else {
		json.NewEncoder(w).Encode(map[string]interface{}{"status": 200, "data": results})
	}
}

func getScoreHandler(w http.ResponseWriter, r *http.Request) {
	uid := r.URL.Query().Get("uid")
	if uid == "" {
		http.Error(w, "UID is required", http.StatusBadRequest)
		return
	}

	db, err := sql.Open("mysql", fmt.Sprintf("%s:%s@tcp(%s)/%s",
		os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_HOST"), os.Getenv("DB_NAME")))
	if err != nil {
		http.Error(w, "Database connection error", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	var score int
	var scoreShort sql.NullString
	err = db.QueryRow("SELECT score, score_short FROM fs_targets WHERE uid = ?", uid).Scan(&score, &scoreShort)
	if err != nil {
		http.Error(w, "Failed to query database", http.StatusInternalServerError)
		return
	}

	statusCode := 200
	if !scoreShort.Valid || scoreShort.String == "" {
		statusCode = 300
	}

	response := map[string]interface{}{
		"score":       score,
		"score_short": scoreShort.String,
		"status_code": statusCode,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func main() {
	http.HandleFunc("/get_score", getScoreHandler)
	http.HandleFunc("/similar_news", getSimilarNews)
	http.HandleFunc("/add-target", addTargetHandler)
	http.HandleFunc("/get_history", getHistoryHandler)
	http.HandleFunc("/check_credentials", checkCredentialsHandler)
	fmt.Println("Server is running on port 8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func addTargetHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var targetReq TargetRequest
	if err := json.NewDecoder(r.Body).Decode(&targetReq); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	uid := uuid.New().String()
	status := "success"

	db, err := sql.Open("mysql", fmt.Sprintf("%s:%s@tcp(%s)/%s",
		os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_HOST"), os.Getenv("DB_NAME")))
	if err != nil {
		http.Error(w, "Database connection error", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	query := "INSERT INTO fs_targets (uid, target, status_code, create_date) VALUES (?, ?, ?, ?)"
	_, err = db.Exec(query, uid, targetReq.TargetURL, 0, time.Now().Unix())
	if err != nil {
		log.Printf("Error inserting record: %v", err)
		http.Error(w, "Failed to insert record", http.StatusInternalServerError)
		return
	}

	response := TargetResponse{
		UID:    uid,
		Status: status,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
