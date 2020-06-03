#!/usr/bin/env bash

gnome-terminal --title="network1" --tab -- /bin/bash -c \
'sudo docker-compose up; read'
