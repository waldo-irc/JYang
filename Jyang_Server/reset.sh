#!/bin/bash
sudo rm data/agents/*
sudo rm data/agents_staged/*
sudo echo '{"chatData":[]}' > data/chat/chat.json
sudo rm data/queue/*
sudo rm data/save_states/*
sudo rm data/routes/*
cd setup && sudo bash certGen.sh