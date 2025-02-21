# Use the official Python 3.11.4 image based on Alpine 3.18
FROM python:3.11.4-alpine3.18

# Set the working directory inside the container
WORKDIR /app

# Copy application files
COPY ./requirements.txt /app/
COPY ./app.py /app/
COPY ./app /app/
COPY ./templates /app/templates
COPY ./static /app/static
COPY ./learn_edfs /app/learn_edfs

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the application port
EXPOSE 8887

# Run the Flask application
CMD ["flask", "run", "--host", "0.0.0.0", "--port", "8887"]
