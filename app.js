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
		let baseUploadPath = 'D:/Kuliah/Program Skripsi/Uploaded/';
		res.statusCode = 200;
		res.setHeader('Content-Type', 'text/html');
		if (req.url == '/fileupload') {
		    var form = formidable({ multiples: true });

		    //parsing input form
		    form.parse(req, function (err, fields, files) {
		    	let namaProject = "./Uploaded/" + fields.projectName + "/";
		    	if(!fs.existsSync(namaProject)){
					fs.mkdirSync(namaProject);
					baseUploadPath = baseUploadPath + fields.projectName + "/"
				}
		    	//looping setiap file dalam directory
    			files.filetoupload.forEach(file => {
    				var oldpath = file.path;
				    var newpath = baseUploadPath + file.name;
					let dir = namaProject + file.name.substring(0, file.name.lastIndexOf("/"));
					// console.log(dir);
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


