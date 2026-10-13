package backend

import (
	"errors"
	"math"
)

var ErrInvalidOperation = errors.New("unsupported operation")
var ErrDivisionByZero = errors.New("division by zero")
var ErrNegativeSquareRoot = errors.New("cannot take the square root of a negative number")
var ErrNonFinite = errors.New("result is outside the supported numeric range")

// Calculate performs a supported arithmetic operation. Unary operations use a;
// binary operations use both a and b.
func Calculate(operation string, a, b float64) (float64, error) {
	var result float64
	switch operation {
	case "add":
		result = a + b
	case "subtract":
		result = a - b
	case "multiply":
		result = a * b
	case "divide":
		if b == 0 { return 0, ErrDivisionByZero }
		result = a / b
	case "power":
		result = math.Pow(a, b)
	case "sqrt":
		if a < 0 { return 0, ErrNegativeSquareRoot }
		result = math.Sqrt(a)
	case "percent":
		result = a / 100
	default:
		return 0, ErrInvalidOperation
	}
	if math.IsNaN(result) || math.IsInf(result, 0) { return 0, ErrNonFinite }
	return result, nil
}
