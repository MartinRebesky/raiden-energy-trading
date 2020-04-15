#!/usr/bin/env bash

gnome-terminal --title="household_1" --tab -- /bin/bash -c \
'cd household_1; node household1.js; read' &

gnome-terminal --title="household_2" --tab -- /bin/bash -c \
'cd household_2; node household2.js; read' &

gnome-terminal --title="household_3" --tab -- /bin/bash -c \
'cd household_3; node household3.js; read' &

gnome-terminal --title="netting_server" --tab -- /bin/bash -c \
'cd netting; node nettingServer.js; read'
