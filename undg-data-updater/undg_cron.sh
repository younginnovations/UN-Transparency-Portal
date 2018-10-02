
#!/bin/bash
NODE_PATH=/usr/lib/nodejs:/usr/lib/node_modules:/usr/share/javascript
PATH=/home/undg/.nvm/versions/node/v8.3.0/bin:/usr/bin:/bin
#sh /home/undg
./automate_undg_xml.sh &> /var/log/automate_undg_xml.log 2>&1

#This should exactly after previous command
if [ $? -eq 0 ]; then
        status="UNDG daily data update completed\n"
else
        status="Error in updating data. See full logs at http://open.undg.org/log\n"
        log=`tail -n 2 /var/log/automate_undg_xml.log`
fi
curl -X POST -H 'Content-type: application/json' \
--data @<(cat <<EOF
{
  "text":"$status$log",
  "username":"undg-data-cron",
  "icon-emoji":":yipl:",
  "channel": "un-transparency"
}
EOF
) "https://hooks.slack.com/services/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"
#https://hooks.slack.com/services/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

ln -s /var/log/automate_undg_xml.log /home/undg/stage/current/dportal/static/log