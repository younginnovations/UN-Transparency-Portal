#!/bin/bash
#validate if the url are empty
dir=$(cd `dirname $0` && pwd)
parentdir="$(dirname "$dir")"

groups=(undp ifad uncdf unfpa unhabitat unicef unocha unesco cerf unops utd wfp unw worldbank ilo unaids fao who unpf ocha_fts un-environment);
#groups=(fao);

for group in "${groups[@]}";
do
	if [ ! -d $parentdir/data/$group ] || [ `ls $parentdir/data/$group |wc -l` -eq 0 ]
	then
		echo "Data Folder of ${group} is empty or doesn't exist";
		exit 1;
	fi
done