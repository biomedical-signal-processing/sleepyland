# Use the official Ruby image as the base
FROM ruby:latest

# Set the working directory inside the container
WORKDIR /app

# Copy necessary files (requirements.txt, environment.yaml, nsrr-download.py)
COPY requirements.txt environment.yaml nsrr-download.py ./

# Copy the nsrr_download.sh script into the container
COPY nsrr_download.sh /app/nsrr_download.sh

# Install system dependencies (expect) and Miniconda
RUN apt-get update && \
    apt-get install -y dos2unix && \
    apt-get install -y --no-install-recommends expect && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

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

# Add Miniconda to the system PATH for future steps
ENV PATH=/opt/conda/bin:$PATH

# Initialize Conda in bash
RUN conda init bash

# Create the conda environment from the YAML file
RUN conda env create -f environment.yaml

# Install additional Python packages in the nsrr-download conda environment
RUN /bin/bash -c "source activate nsrr-download && \
    pip install python-multipart && \
    conda install -y pip && \
    pip install -r requirements.txt"

# Install the nsrr gem
RUN gem install nsrr --no-document

# Ensure the nsrr_download.sh script is executable
RUN chmod +x /app/nsrr_download.sh

RUN dos2unix /app/nsrr_download.sh

# Expose the port the application will run on
EXPOSE 8500

# Default command to run the nsrr-download FastAPI app, activate environment, and set PYTHONPATH
CMD ["/bin/bash", "-c", "source activate nsrr-download && export PYTHONPATH='/app' && uvicorn nsrr-download:app --host 0.0.0.0 --port 8500"]
