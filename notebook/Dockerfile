FROM remnrem/lunapi:latest

WORKDIR /app

COPY ./src .
COPY ./resources ../resources

# Assicuriamoci di essere root e installiamo useradd se non presente
USER root
RUN apt-get update && apt-get install -y passwd && \
    useradd -ms /bin/bash user && \
    chown -R user:user /home/user /app /resources

# Installazione dei pacchetti necessari
RUN apt-get update && pip install jupyterlab requests yasa

# Impostiamo l'utente 'user' per evitare problemi di permessi
USER user

# Creazione della cartella di configurazione di Jupyter con i permessi corretti
RUN mkdir -p /home/user/.jupyter && \
    echo "c.ServerApp.token = ''" >> /home/user/.jupyter/jupyter_server_config.py && \
    echo "c.ServerApp.password = ''" >> /home/user/.jupyter/jupyter_server_config.py && \
    echo "c.ServerApp.disable_check_xsrf = True" >> /home/user/.jupyter/jupyter_server_config.py

# Esponiamo la porta 8888
EXPOSE 8888

# Comando di avvio di Jupyter
CMD ["jupyter", "lab", "--ip=0.0.0.0", "--port=8888", "--allow-root"]



