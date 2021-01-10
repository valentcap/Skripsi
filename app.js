const http = require('http');
const fs = require('fs');
var formidable = require('formidable');
var mv = require('mv');


const hostname = '127.0.0.1';
const port = 3000;

const baseUploadPath = 'D:/Kuliah/Program Skripsi/Uploaded/';

fs.readFile('index.html', (err, html) => {
	if(err){
		throw err;
	}

	const server = http.createServer((req, res) => {
		res.statusCode = 200;
		res.setHeader('Content-Type', 'text/html');
		if (req.url == '/fileupload') {
		    var form = formidable({ multiples: true });
		    let allFiles = [];
		    form.parse(req, function (err, fields, files) {
    			console.log(files)

    			files.filetoupload.forEach(file => {
    				var oldpath = file.path;
				    var newpath = baseUploadPath + file.name;
					//let dir = "./Uploaded/" + file.name.split("/")[file.name.split("/").length-2];
					let dir = "./Uploaded/" + file.name.substring(0, file.name.lastIndexOf("/"));
					console.log(dir);
					if(!fs.existsSync(dir)){
						fs.mkdirSync(dir);
					}
				    mv(oldpath, newpath, function (err) {
				    	if (err) {
				    		throw err;
				    	}
				    });
    			});
    			res.write('File uploaded and moved!');
				res.write('<input type="button" value="Go back!" onclick="history.back()">');
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
			res.end();
		}
		
	});

	server.listen(port, hostname, () => {
	  console.log(`Server running at http://${hostname}:${port}/`);
	});
})


