#!/bin/bash
years=$(mongo --quiet localhost:27017/etenders fetch_year.js)

#
for year in $years
    do
         echo $year
         echo $(date)
         mongo --quiet --eval "var year=$year" localhost:27017/etenders create_json_files.js > record_$year.json
    done
