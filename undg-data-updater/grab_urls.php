<?php
/*
 *      grab_urls.php
 *
 *      Copyright 2012 caprenter <caprenter@gmail.com>
 *
 *      This file is part of IATI Registry Refresher.
 *
 *      IATI Registry Refresher is free software: you can redistribute it and/or modify
 *      it under the terms of the GNU General Public License as published by
 *      the Free Software Foundation, either version 3 of the License, or
 *      (at your option) any later version.
 *
 *      IATI Registry Refresher is distributed in the hope that it will be useful,
 *      but WITHOUT ANY WARRANTY; without even the implied warranty of
 *      MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *      GNU General Public License for more details.
 *
 *      You should have received a copy of the GNU General Public License
 *      along with IATI Registry Refresher.  If not, see <http://www.gnu.org/licenses/>.
 *
 *      IATI Registry Refresher relies on other free software products. See the README.txt file
 *      for more details.
 */


// Display errors for demo
@ini_set('error_reporting', E_ALL);
@ini_set('display_errors', 'stdout');

// Function to perform an API request against the IATI Registry CKAN v3 API
function api_request($path, $data=null, $ckan_file=null) {
    $api_root = "https://iatiregistry.org/api/3/";

    if ($data === null) $data_string = '{}';
    else $data_string = json_encode($data);

    $ch = curl_init($api_root.$path);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data_string);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Content-Type: application/json',
        'Content-Length: '.strlen($data_string))
    );

    // Try up to 5 times if we get a 500 error.
    for ($i=0; $i<5; $i++) {
        $result = curl_exec($ch);
        if (curl_getinfo($ch)['http_code'] == 500) {
            // Wait a second before we retry
            sleep(1);
        }
        else {
            break;
        }
    }
    curl_close($ch);

    if ($ckan_file !== null) {
        // Save CKAN json from the API call to a file
        file_put_contents($ckan_file, $result, LOCK_EX);
    }

    return json_decode($result)->result;
}

//Empty variables
$urls = array();

//Pull all the group identifiers from the registry
//We store them in an array , $groups, for later use
//$groups = api_request('action/organization_list');

//Overide the group array, e.g. for testing. Uncomment and edit the line(s) below
//$groups = array("hewlett-foundation","aa");
//$groups = array("dfid");
$groups = array("undp","ifad","uncdf","unfpa","unhabitat","unicef","unocha","unesco","cerf","unops","utd","wfp","unw","worldbank","ilo","unaids","fao","who","unpf","ocha_fts","un-environment","iom");
//$groups = array("fao");

//Loop through each group and save the URL end-points of the data files
//You may need to set up an empty directory called "urls"
echo "Fetching:" . PHP_EOL;
foreach ($groups as $group) {
    $file = "urls/" . $group;
    echo $group."\n";
    try {
        $urls_string = '';
        $result = api_request('action/package_search', array('fq'=>"organization:".$group, 'rows'=>1000000), "ckan/" . $group);
        foreach ($result->results as $package) {
            try {
                $urls_string .= $package->name . ' ' . (string)$package->resources[0]->url . PHP_EOL;
            } catch (Exception $e) {
                // Catch exceptions here to prevent one url from breaking an entire publisher
                print 'Caught exception in '.$file.': ' . $e->getMessage();
            }
        }
        file_put_contents($file, $urls_string, LOCK_EX);
    } catch (Exception $e) {
        print 'Caught exception in '.$file.': ' . $e->getMessage();
    }
}

?>