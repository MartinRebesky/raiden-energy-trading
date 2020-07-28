#!/usr/bin/env bash

gnome-terminal --title="network1" --tab -- /bin/bash -c \
'cd network0; docker-compose up --build; read' &

gnome-terminal --title="network2" --tab -- /bin/bash -c \
'cd network1; docker-compose up --build; read'
