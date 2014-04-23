w3c-validate
============

OpenClassrooms W3C validate tool

QUICKSTART
- npm install
- cp config.yaml.dist config.yaml
- edit config.yaml :
  . change 'baseUrl' with base url of website to test
  . fill 'url' with all uri to test
- run 'node validate.js' will create a static html file
- run 'grunt' to launch a static server
- go to http://localhost:9001 to display results
