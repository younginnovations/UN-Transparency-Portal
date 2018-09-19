#!/bin/bash
set -e;
scriptdir=$(cd `dirname $0` && pwd)
echo $scriptdir

# pwd=$(pwd)

# echo $pwd

echo "Cron task started"

echo $(date)

rm -rf ckan data urls

mkdir ckan data urls

php grab_urls.php
$scriptdir/extras/validateurl.sh
echo "data fetch statred"

$scriptdir/fetch_data.sh

#validate the url and downloaded data
$scriptdir/extras/validatedata.sh
set +e;

echo "Data validation complete"
echo "Data fetch completed"

echo "Remove old files from dstore/data"

rm -rf dstore/data/

echo "Copying new data to dstore/data"
cp -r data dstore


echo "create backup of existing db"

cd $scriptdir/dstore/db/

tar -zcvf db_latest.tar.gz dstore.sqlite

cd $scriptdir

echo "DB generation started"

./generate_sqlite_2

sleep 30

#test if the generated sqlite size if large enough
cd $scriptdir/dstore/db/
if [[ "$(expr `stat -c %s dstore.sqlite` / 1000000)" -lt 1000 ]];
then
        echo "sqlite file is smaller than 1 GB probably some error"
        echo "reverting back to last database"
        tar -zcvf db_error.tar.gz dstore.sqlite
        tar -zxvf db_latest.tar.gz

else
        cp $scriptdir/dstore/db/dstore.sqlite /home/undg/stage/current/dstore/db/
fi

# cd /home/undg/stage/current
# pkill -9 node
# nohup ./serv --port=1337 & > /dev/null

# sleep 30

# echo "copying gz file to static"

# cd /home/undg/stage/current/dstore/
# cp data.tar.gz /home/undg/stage/current/dportal/static/

echo "Cron task completed."
echo $(date)



