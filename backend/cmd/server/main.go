package main

import (
	"log"
	"net/http"
	"os"

	"calculator/backend"
)

func main() {
	addr := os.Getenv("ADDR")
	if addr == "" {
		addr = ":8080"
	}
	log.Printf("calculator API listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, backend.NewHandler()))
}
