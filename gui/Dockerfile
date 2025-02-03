# Use the official Python 3.11.4 image based on Alpine 3.18 as the base image.
# Alpine is a minimal Docker image, which helps to reduce the final image size.
FROM python:3.11.4-alpine3.18

# Set the working directory inside the container to /app.
# This is where all subsequent commands will be run and where files will be copied.
WORKDIR /app

# Copy the requirements.txt file from the host machine to the /app directory in the container.
# This file lists all the Python packages that need to be installed.
COPY ./requirements.txt /app/

# Copy the app.py file from the host machine to the /app directory in the container.
# This is the main Python script that will run the Flask application.
COPY ./app.py /app/

# Copy the app directory from the host machine to the /app directory in the container.
# This directory contains additional Python scripts and modules used by the Flask application.
COPY ./app /app/

# Install the Python packages listed in requirements.txt.
# This command will run `pip install` inside the container, setting up the environment with the required packages.
RUN pip install -r requirements.txt

# Create a directory named 'templates' inside the /app directory.
# This directory will be used to store HTML templates for the Flask application.
RUN mkdir templates

# Create a directory named 'static' inside the /app directory.
# This directory will be used to store static files like CSS, JavaScript, and images.
RUN mkdir static

# Copy the templates directory from the host machine to the /app directory in the container.
# This directory contains the HTML/JS templates that will be rendered by the Flask application.
COPY ./templates /app/templates

# Copy the static directory from the host machine to the /app directory in the container.
# This directory contains static files like CSS, JavaScript, and images used by the Flask application.
COPY ./static /app/static

# Copy the learn_edfs directory from the host machine to the /app directory in the container.
# This directory contains the EDF files used by the Flask application.
COPY ./learn_edfs /app/learn_edfs

# Expose port 8887 on the container.
# This is the port on which the Flask application will listen for incoming requests.
EXPOSE 8887

# Specify the command to run when the container starts.
# This command runs the Flask application, binding it to all network interfaces (0.0.0.0) and port 8887.
CMD ["flask", "run", "--host", "0.0.0.0", "--port", "8887"]
