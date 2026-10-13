package backend

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCalculateEndpoint(t *testing.T) {
	for _, tt := range []struct { body string; status int; contains string }{
		{`{"operation":"add","a":2,"b":5}`, http.StatusOK, `"result":7`},
		{`{"operation":"sqrt","a":81}`, http.StatusOK, `"result":9`},
		{`{"operation":"percent","a":25}`, http.StatusOK, `"result":0.25`},
		{`{"operation":"divide","a":2,"b":0}`, http.StatusUnprocessableEntity, `"error"`},
		{`{"operation":"sqrt","a":-1}`, http.StatusUnprocessableEntity, `"error"`},
		{`{"operation":"add","a":2}`, http.StatusBadRequest, `"error"`},
		{`{"operation":"add","b":2}`, http.StatusBadRequest, `"error"`},
		{`{"operation":"add","a":"x","b":2}`, http.StatusBadRequest, `"error"`},
		{`{"operation":"add","a":2,"b":3,"extra":4}`, http.StatusBadRequest, `"error"`},
		{`{"operation":"unknown","a":2,"b":3}`, http.StatusBadRequest, `"error"`},
		{`not-json`, http.StatusBadRequest, `"error"`},
		{`{"operation":"add","a":2,"b":3} {"operation":"add"}`, http.StatusBadRequest, `"error"`},
	} {
		req := httptest.NewRequest(http.MethodPost, "/api/calculate", strings.NewReader(tt.body)); res := httptest.NewRecorder()
		NewHandler().ServeHTTP(res, req)
		if res.Code != tt.status || !strings.Contains(res.Body.String(), tt.contains) { t.Errorf("response = %d %s; want %d containing %s", res.Code, res.Body.String(), tt.status, tt.contains) }
	}
}

func TestHealthAndCORS(t *testing.T) {
	handler := NewHandler()

	request := httptest.NewRequest(http.MethodGet, "/health", nil)
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	if response.Code != http.StatusOK || !strings.Contains(response.Body.String(), `"status":"ok"`) {
		t.Fatalf("health response = %d %s", response.Code, response.Body.String())
	}
	if got := response.Header().Get("Content-Type"); got != "application/json" {
		t.Errorf("health Content-Type = %q; want application/json", got)
	}
	if got := response.Header().Get("Access-Control-Allow-Origin"); got != "*" {
		t.Errorf("health CORS origin = %q; want *", got)
	}

	request = httptest.NewRequest(http.MethodOptions, "/api/calculate", nil)
	response = httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	if response.Code != http.StatusNoContent {
		t.Errorf("preflight status = %d; want %d", response.Code, http.StatusNoContent)
	}
	if got := response.Header().Get("Access-Control-Allow-Methods"); !strings.Contains(got, "POST") {
		t.Errorf("preflight methods = %q; expected POST", got)
	}
}
