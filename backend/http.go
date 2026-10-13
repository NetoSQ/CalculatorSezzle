package backend

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"math"
)

type calculationRequest struct {
	Operation string   `json:"operation"`
	A         *float64 `json:"a"`
	B         *float64 `json:"b"`
}
type calculationResponse struct {
	Result float64 `json:"result"`
}
type errorResponse struct {
	Error string `json:"error"`
}

// NewHandler returns the JSON REST API handler.
func NewHandler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) { writeJSON(w, http.StatusOK, map[string]string{"status":"ok"}) })
	mux.HandleFunc("POST /api/calculate", calculateHandler)
	return cors(mux)
}

func calculateHandler(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	var input calculationRequest
	if err := decoder.Decode(&input); err != nil { writeJSON(w, http.StatusBadRequest, errorResponse{"request must contain valid JSON with operation and numeric inputs"}); return }
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF { writeJSON(w, http.StatusBadRequest, errorResponse{"request must contain a single JSON object"}); return }
	if input.A == nil { writeJSON(w, http.StatusBadRequest, errorResponse{"field 'a' is required"}); return }
	binary := input.Operation == "add" || input.Operation == "subtract" || input.Operation == "multiply" || input.Operation == "divide" || input.Operation == "power"
	if binary && input.B == nil { writeJSON(w, http.StatusBadRequest, errorResponse{"field 'b' is required for this operation"}); return }
	if input.B != nil && (math.IsNaN(*input.B) || math.IsInf(*input.B, 0)) || math.IsNaN(*input.A) || math.IsInf(*input.A, 0) { writeJSON(w, http.StatusBadRequest, errorResponse{"inputs must be finite numbers"}); return }
	b := 0.0
	if input.B != nil { b = *input.B }
	result, err := Calculate(input.Operation, *input.A, b)
	if err != nil {
		status := http.StatusBadRequest
		if errors.Is(err, ErrDivisionByZero) || errors.Is(err, ErrNegativeSquareRoot) { status = http.StatusUnprocessableEntity }
		writeJSON(w, status, errorResponse{err.Error()}); return
	}
	writeJSON(w, http.StatusOK, calculationResponse{result})
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions { w.WriteHeader(http.StatusNoContent); return }
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
