var http = require('http')

http.createServer(function (request, response) {

  var fs = require('fs');

  var rs = fs.createReadStream('./topology.txt');
  var readline = require('readline');
  var rl = readline.createInterface(rs, {});
  var splitter = [];
  var nodejs = [];
  var lineIndex = 0;
  var hostBegin = 0;
  var linkBegin = 0;
  rl.on('line', function(line) {
    splitter = line.split(" ");
    if(splitter[0] == 'host'){
      hostBegin = lineIndex;
    } else if (splitter[0] == 'link') {
      linkBegin = lineIndex;
    } else {
      lineIndex++;
      var il = {id: splitter[0], label: splitter[1]};
      nodejs.push(il);
    }
  }).on('close', function(){
    var nodeData = new String();
    var linkData = new String();
    for (var i=0; i < hostBegin; i++) {
      nodeData += "{id:'"+nodejs[i].id+"',label:'"+nodejs[i].label+"'},";
    }
    for (var i=hostBegin; i < linkBegin; i++) {
      nodeData += "{id:'"+nodejs[i].id+"',label:'"+nodejs[i].label+"',color:'red'},";      
    }
    for (var i=linkBegin; i < nodejs.length; i++) {
      linkData += "{from:'"+nodejs[i].id+"',to:'"+nodejs[i].label+"'},";
    }

  var data = '<!doctype html>'+
'<html>'+
'  <head>'+
'    <title>Virtual Network Topology</title>'+
'    <script src="http://visjs.org/dist/vis.js"></script>'+
'    <link href="http://visjs.org/dist/vis.css" rel="stylesheet" type="text/css" />'+
'    <style type="text/css">'+
'      body, html {'+
'        font-family: sans-serif;'+
'      }'+
'    </style>'+
'  </head>'+
'  <body>'+
'    <div id="mynetwork"></div>'+
'    <script type="text/javascript">'+
'      var nodes = ['+
nodeData+
'      ];'+
'      var edges = ['+
linkData+
'      ];'+
"      var container = document.getElementById('mynetwork');"+
'      var data = {'+
'        nodes: nodes,'+
'        edges: edges'+
'      };'+
'      var options = {'+
"        width: '100px',"+
"        height: '100px'"+
'      };'+
'      var network = new vis.Network(container, data, options);'+
'    </script>'+
'  </body>'+
'</html>';

  response.writeHead(200, {'Content-Type': 'text/html'});
  response.write(data);
  response.end();



  });




}).listen(8174);

console.log('Server running at http://127.0.0.1:8174/');
