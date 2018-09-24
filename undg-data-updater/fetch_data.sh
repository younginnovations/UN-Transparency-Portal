#!/bin/bash
#
#      fetch_data.sh
#
#      Copyright 2012 caprenter <caprenter@gmail.com>
#
#      This file is part of IATI Registry Refresher.
#
#      IATI Registry Refresher is free software: you can redistribute it and/or modify
#      it under the terms of the GNU General Public License as published by
#      the Free Software Foundation, either version 3 of the License, or
#      (at your option) any later version.
#
#      IATI Registry Refresher is distributed in the hope that it will be useful,
#      but WITHOUT ANY WARRANTY; without even the implied warranty of
#      MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#      GNU General Public License for more details.
#
#      You should have received a copy of the GNU General Public License
#      along with IATI Registry Refresher.  If not, see <http://www.gnu.org/licenses/>.
#
#      IATI Registry Refresher relies on other free software products. See the README.txt file
#      for more details.
#

# Set the internal field seperator to newline, so that we can loop over newline
# seperated url lists correctly.
IFS=$'\n'

FILES=urls/*
for f in $FILES
do
  for url_line in `cat $f`; do
    url=`echo $url_line | sed 's/^[^ ]* //'`
    package_name=`echo $url_line | sed 's/ .*$//'`
    mkdir -p data/`basename $f`/

    # --no-check-certificate added to deal with sites using https - not the
    #                        best solution!
    # --restrict-file-names=nocontrol ensures that UTF8 files get created
    #                                 properly
    # -U sets our custom user agent, which allows sites to keep track of which
    #    robots are accessing them
    # --read-timeout=180 times out if no data is sent for more than 10 seconds
    # --dns-timeout=10 times out if DNS information takes longer than 10 seconds
    # --connect-timeout=10 times out if establishing a connection takes longer
    #                      than 10 seconds
    # --tries=3 means a download is tried at most 3 times
    wget --no-check-certificate --restrict-file-names=nocontrol --tries=3 --read-timeout=180 --dns-timeout=10 --connect-timeout=10 -U "IATI-Data-Snappshotter" "$url" -O data/`basename $f`/$package_name
    # Fetch the exitcode of the previous command
    exitcode=$?
    # If the exitcode is not zero (ie. there was an error), output to STDOUT
    if [ $exitcode -ne 0 ]; then
      echo $exitcode `basename $f` $url_line
    fi

    # Delay of 1 second between requests, so as not to upset servers
    sleep 1s
  done
done