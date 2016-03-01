#!/bin/bash

port=$1

if (lsof -i :$port)
  then
    kill -9 $(lsof -i :$port | awk '{print $2}')
  fi
