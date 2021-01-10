const http = require('http');
const fs = require('fs');
var formidable = require('formidable');
var mv = require('mv');


const hostname = '127.0.0.1';
const port = 3000;

fs.readFile('index.html', (err, html) => {
	if(err){
		throw err;
	}

	const server = http.createServer((req, res) => {
		res.statusCode = 200;
		res.setHeader('Content-Type', 'text/html');
		if (req.url == '/fileupload') {
		    var form = formidable({ multiples: true });
		    form.parse(req, function (err, fields, files) {
		    	res.writeHead(200, { 'content-type': 'application/json' });
    			// res.end(JSON.stringify({ fields, files }, null, 2));


    			files.filetoupload.forEach(file => {
    				// JSON.stringify(file, null, 1);
    				// console.log(JSON.stringify(file, null, 1));
    				var oldpath = files.filetoupload.path;
				    var newpath = 'D:/Kuliah/Program Skripsi/Uploaded/' + files.filetoupload.name;
				    mv(oldpath, newpath, function (err) {
				    	if (err) {
				    		throw err;
				    	}
				        res.write('File uploaded and moved!');
				        res.write('<input type="button" value="Go back!" onclick="history.back()">');
				        res.end();
				    });
    			});
    			res.end();
				
		   		// var oldpath = files.filetoupload.path;
			    // var newpath = 'D:/Kuliah/Program Skripsi/Uploaded/' + files.filetoupload.name;
			    // mv(oldpath, newpath, function (err) {
			    // 	if (err) {
			    // 		throw err;
			    // 	}
			    //     res.write('File uploaded and moved!');
			    //     res.write('<input type="button" value="Go back!" onclick="history.back()">');
			    //     res.end();
			    // });
		    });
		}else{
			res.write(html);
			// const testFolder = './tests/';
			// //Baca file dalam folder
			// fs.readdir(testFolder, (err, files) => {
				// files.forEach(file => {
				// 	console.log(file);
				// });
			// });
			res.end();
		}
		
	});

	server.listen(port, hostname, () => {
	  console.log(`Server running at http://${hostname}:${port}/`);
	});
})


