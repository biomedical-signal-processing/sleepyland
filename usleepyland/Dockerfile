# Pull base image
FROM ubuntu:20.04

# Set the working directory inside the container to /app.
WORKDIR /app

# Copy the requirements.txt file from the host machine to the /app directory in the container.
RUN apt-get update && apt-get install -y wget bzip2 git && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Clone the U-Time-Sleepyland repository from GitHub.
RUN git clone https://github.com/biomedical-signal-processing/uSLEEPYLAND.git

# Install Miniconda to manage Python packages and environments.
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

# Add Miniconda to the system PATH.
ENV PATH=/opt/conda/bin:$PATH

# Initialize conda in the bash shell.
RUN conda init bash

# Set the working directory inside the container to /app/uSLEEPYLAND.
WORKDIR /app/uSLEEPYLAND

# Copy the environment.yaml file from the host machine to the /app/uSLEEPYLAND directory in the container.

# Copy the src/ directory from the host machine to the /app/uSLEEPYLAND directory in the container.
COPY src/ /app/uSLEEPYLAND/src/

# Copy the model/ directory from the host machine to the /app/uSLEEPYLAND/ directory in the container.
COPY model/ /app/uSLEEPYLAND/

# Create a new conda environment named u-sleepyland-tfcuda using the environment.yaml file.
RUN conda env create -f environment.yaml

# Install additional packages required for the FastAPI application.
RUN apt-get update && apt-get install -y gcc g++ make libgomp1 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Activate the u-sleepyland-tfcuda conda environment and install additional Python packages using pip.
RUN /bin/bash -c "source activate u-sleepyland-tfcuda && \
    pip install python-multipart && \
    conda install -y pip && \
    pip install fastapi==0.95.0 pydantic==1.10.2 typing_extensions>=4.0.0 uvicorn pyyaml && \
    pip install -r requirements.txt"

# Set the LD_PRELOAD environment variable to the path of the libgomp shared library.
ENV LD_PRELOAD=/opt/conda/envs/u-sleepyland-tfcuda/lib/python3.9/site-packages/sklearn/utils/../../scikit_learn.libs/libgomp-a34b3233.so.1.0.0

# Expose port 7777 on the container for the FastAPI application.
EXPOSE 7777

# Specify the command to run when the container starts.
CMD ["/bin/bash", "-c", "source activate u-sleepyland-tfcuda && export PYTHONPATH='/app/uSLEEPYLAND' && uvicorn src.predict:app --host 0.0.0.0 --port 7777"]