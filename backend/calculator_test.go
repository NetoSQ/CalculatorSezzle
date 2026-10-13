package backend

import (
	"errors"
	"math"
	"testing"
)

func TestCalculate(t *testing.T) {
	tests := []struct { op string; a, b, want float64 }{
		{"add", 7, 3, 10}, {"subtract", 7, 3, 4}, {"multiply", 7, 3, 21},
		{"divide", 7, 2, 3.5}, {"power", 2, 3, 8}, {"sqrt", 9, 0, 3}, {"percent", 25, 0, .25},
	}
	for _, tt := range tests { t.Run(tt.op, func(t *testing.T) { got, err := Calculate(tt.op, tt.a, tt.b); if err != nil || got != tt.want { t.Fatalf("Calculate() = %v, %v; want %v, nil", got, err, tt.want) } }) }
}
func TestCalculateErrors(t *testing.T) {
	for _, tt := range []struct { op string; a,b float64; want error }{{"divide", 1, 0, ErrDivisionByZero}, {"sqrt", -1, 0, ErrNegativeSquareRoot}, {"unknown", 1, 2, ErrInvalidOperation}, {"power", 1e308, 2, ErrNonFinite}} {
		_, err := Calculate(tt.op, tt.a, tt.b); if !errors.Is(err, tt.want) { t.Errorf("Calculate(%q) error = %v; want %v", tt.op, err, tt.want) }
	}
	if got, _ := Calculate("sqrt", 2, 0); math.Abs(got-math.Sqrt(2)) > 1e-12 { t.Fatal("sqrt precision mismatch") }
}
