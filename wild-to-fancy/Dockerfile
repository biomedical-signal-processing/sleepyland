# Use the latest version of the Ubuntu base image
FROM ubuntu:latest

# Set the working directory to /app
WORKDIR /app

# Update the package list and install necessary tools: wget, bzip2, and git
RUN apt-get update && apt-get install -y wget bzip2 git && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Clone the repository from GitHub
RUN git clone https://github.com/biomedical-signal-processing/wild-to-fancy.git

# Download and install Miniconda, a minimal installer for conda
ARG TARGETARCH
RUN if [ "$TARGETARCH" = "amd64" ]; then \
        wget --quiet https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh && \
        bash Miniconda3-latest-Linux-x86_64.sh -b -p /opt/conda && \
        rm Miniconda3-latest-Linux-x86_64.sh; \
    elif [ "$TARGETARCH" = "arm64" ]; then \
        wget --quiet https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-aarch64.sh && \
        bash Miniconda3-latest-Linux-aarch64.sh -b -p /opt/conda && \
        rm Miniconda3-latest-Linux-aarch64.sh; \
    else \
        echo "Architecture not supported"; \
        exit 1; \
    fi

# Add the conda installation directory to the PATH environment variable
ENV PATH=/opt/conda/bin:$PATH

# Initialize conda in the bash shell
RUN conda init bash

# Copy the environment.yaml file from the host machine to the /app directory in the container
COPY src ./wild-to-fancy/src

# Set the working directory to /app/wild-to-fancy
WORKDIR wild-to-fancy

# Create a conda environment based on the environment.yaml file
RUN conda env create -f environment.yaml

# Activate the conda environment and install additional Python packages
RUN /bin/bash -c "source activate wtfancy && \
    pip install python-multipart && \
    conda install -y pip && \
    pip install fastapi uvicorn && \
    pip install -r requirements.txt"

# Expose port 6666 on the container because the FastAPI application will run on this port and listen for incoming requests
EXPOSE 6666

# Specify the command to run when the container starts
CMD ["/bin/bash", "-c", "source activate wtfancy && export PYTHONPATH='/app/wild-to-fancy' && uvicorn src.harmonize:app --host 0.0.0.0 --port 6666"]