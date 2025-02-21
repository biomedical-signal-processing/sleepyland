FROM python:latest

WORKDIR /app

# Copy only requirements.txt to take advantage of Docker layer caching
COPY requirements.txt /app/requirements.txt

# Copy the application source code into the container
COPY ./src /app/src

# Install Python and pip
RUN apt-get update && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies (avoiding cache to keep the image light)
RUN pip3 install --no-cache-dir -r requirements.txt

# Set PYTHONPATH to ensure the application can find the src module
ENV PYTHONPATH="${PYTHONPATH}:/app/src"

# Expose the port on which the FastAPI application will run
EXPOSE 8989

# Define the default command to run when the container starts
CMD ["uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "8989"]



