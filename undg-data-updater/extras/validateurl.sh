#!/bin/bash
#validate if the url are empty
dir=$(cd `dirname $0` && pwd)
parentdir="$(dirname "$dir")"
echo $parentdir
groups=(undp ifad uncdf unfpa unhabitat unicef unocha unesco cerf unops utd wfp unw worldbank ilo unaids fao who unpf ocha_fts un-environment);
#groups=(fao);

for group in "${groups[@]}";
do
	if [ ! -s $parentdir/urls/$group ]
	then
		echo "No of url in ${group} is 0";
		exit 1;
	fi
done