# Use the official Golang image as the base image
FROM golang:1.23.11

# Set the Current Working Directory inside the container
WORKDIR /app

# Copy the Go application source code
COPY . .

# Build the Go app
RUN go mod tidy && go build -o main .

# Command to run the executable
CMD ["./main"]
