#!/bin/bash

git reset --hard && git pull && npm install && npm run build && docker restart account-bot
