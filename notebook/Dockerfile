FROM remnrem/lunapi:latest

WORKDIR /app

COPY ./src .
COPY ./resources ../resources

USER root

RUN useradd -ms /bin/bash user
RUN apt-get update
RUN pip install jupyterlab
RUN pip install requests
RUN pip install yasa

RUN chmod -R 777 /app/lunapi-notebooks

# Disable token and password authentication
RUN echo "c.ServerApp.token = ''" >> /home/$NB_USER/.jupyter/jupyter_server_config.py
RUN echo "c.ServerApp.password = ''" >> /home/$NB_USER/.jupyter/jupyter_server_config.py
RUN echo "c.ServerApp.disable_check_xsrf = True" >> /home/$NB_USER/.jupyter/jupyter_server_config.py

EXPOSE 8888

CMD ["jupyter", "lab", "--ip=0.0.0.0", "--port=8888", "--no-browser", "--allow-root"]



