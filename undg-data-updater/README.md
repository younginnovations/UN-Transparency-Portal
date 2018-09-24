UNDG-DATA-UPDATER
===================

This is an app only used to download the data files from IATI-Registry and process them to create a sqlite database for UNDG-Portal.

Directory Structure
===================
- **DStore** is an optimized nodejs + SQLite database for use in real time queries. This folder contains script to create database by processing the data files that we have downloaded from IATI-Registry.

- **extras** is a folder that contains 2 bash scripts files  that verifies the URLs and data that are fetched from IATI. It contains **validateurl.sh** for verifying the download URLs and **validatedata.sh** for verifying that the data downloaded contains any informations.


Data fetching files
===================

- **grab_urls.php** it's an php file which fetchs the URL link to download the required files. In this file we have an array of UN agencies publishing in IATI. We loop through this array to grab the URLs related to data of those publishers and store in a folder **"urls"**.

- **fetch_data.sh** it's a bash script that reads each sub-folders from **"urls"** folder and fetch/download data files from those links and store them in a folder **"data"**.

- **generate_sqlite_2** this script runs  a loop through the files that has been downloaded and call the nodejs function in dstore/js folder to process the file and create the sqlite database.

Bash scripts for running the process
====================
- **undg_cron.sh** this is the main bash scriot files which initializes the node path for the script and specifies the log file for the script logs to be written. This script calls the processing bash file **automate_undg_xml.sh** and checks if all the process has run correctly and notifies on the slack channel about it's success and encountered error (if any).

- **automate_undg_xml.sh** this is the main processing script where all the necessary actions take place. First it call the **grab_urls.php** script to fetch the all the required URLs. Then it runs the script **validateurl.sh** to check if all the URLs has been fetched correctly. After fetching URLs it runs **fetch_data.sh** to fetch all the data files from IATI and validate the files by running the script **validatedata.sh**. Then the downloaded **/data** folder is moved inside the **/dstore** folder. Then it takes a back up of the current database file and runs **generate_sqlite_2** script where the sqlite database generation script is runnned. After the generating script is completed it checks for the size of the database to move it to the UNDG-Portal. If the size is less than 1 GB then the backed up database file is restored otherwise the new database file is moved to the UNDG-Portal's **dstore** folder.