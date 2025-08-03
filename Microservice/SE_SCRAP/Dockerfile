# Use the official Golang image as the base image
FROM golang:1.23.11

# Set the Current Working Directory inside the container
WORKDIR /app

# Copy go mod and sum files
COPY go.mod ./
COPY go.sum ./

# Initialize Go module, tidy up the go.mod file, and download all dependencies

RUN go mod tidy && go mod download
RUN go mod download

# Copy the source from the current directory to the Working Directory inside the container
COPY . .

# Build the Go app
RUN go mod tidy && go build -o main .

# Expose port 8080 to the outside world
EXPOSE 8080

# Command to run the executable
CMD ["./main"]
