const http = require('http');
const fs = require('fs');
var formidable = require('formidable');
var mv = require('mv');
const javaMethodParser = require('java-method-parser');

const hostname = '127.0.0.1';
const port = 3000;


fs.readFile('index.html', (err, html) => {
	if(err){
		throw err;
	}

	const server = http.createServer((req, res) => {
		// let baseUploadPath = './Uploaded/';
		let namaProject = "./Uploaded/";
		res.statusCode = 200;
		res.setHeader('Content-Type', 'text/html');

		if (req.url == '/fileupload') {
		    var form = formidable({ multiples: true });

		    //parsing input form
		    form.parse(req, function (err, fields, files) {
		    	namaProject = namaProject + fields.projectName + "/";
		    	if(!fs.existsSync(namaProject)){
					fs.mkdirSync(namaProject);
					// baseUploadPath = baseUploadPath + fields.projectName + "/";
				}
				//cek file apakah ada banyak
				if(files.filetoupload.length>1){
			    	//looping setiap file dalam directory
	    			files.filetoupload.forEach(file => {
	    				var oldpath = file.path;
					    var newpath = namaProject + file.name;
						let dir = namaProject + file.name.substring(0, file.name.lastIndexOf("/"));

						//cek apakah file java atau bukan
						if(file.name.substring(file.name.lastIndexOf("."), file.name.length) == ".java"){
							

							let content = fs.readFileSync(oldpath, "utf8");
							let output = javaMethodParser(content);
							//ubah hasil parsing menjadi string
							output = JSON.stringify(output, null, 3);

							if(!fs.existsSync(dir)){
								fs.mkdirSync(dir);
							}
							//func baru, pre process lalu move
							console.log(newpath);
							fs.writeFileSync(newpath+".json", output);

							//func lama, move upload
						    // mv(oldpath, newpath, function (err) {
						    // 	if (err) {
						    // 		throw err;
						    // 	}
						    // });
						}else{
							console.log(file.name.substring(file.name.lastIndexOf("."), file.name.length));
						}
						
	    			});
	    		}else{
	    			//hanya 1 file saja
	    			let file = files.filetoupload;
	    			var oldpath = file.path;
				    var newpath = namaProject + file.name;
					let dir = namaProject + file.name.substring(0, file.name.lastIndexOf("/"));

					//cek apakah file java atau bukan
					if(file.name.substring(file.name.lastIndexOf("."), file.name.length) == ".java"){
						

						let content = fs.readFileSync(oldpath, "utf8");
						let output = javaMethodParser(content);
						//ubah hasil parsing menjadi string
						output = JSON.stringify(output, null, 3);

						if(!fs.existsSync(dir)){
							fs.mkdirSync(dir);
						}
						//func baru, pre process lalu move
						console.log(newpath);
						fs.writeFileSync(newpath+".json", output);

						//func lama, move upload
					    // mv(oldpath, newpath, function (err) {
					    // 	if (err) {
					    // 		throw err;
					    // 	}
					    // });
					}else{
						// console.log(file.name.substring(file.name.lastIndexOf("."), file.name.length));
					}
	    		}
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
		}
		else if(req.url == '/manual-parse'){
			var form = formidable({ multiples: false });
			form.parse(req, function (err, fields, files) {
				fs.readFile(files.javafile.path, function (err, data) {
					res.end(data);
				});
			});
		}

		else{
			//page home normal
			res.write(html);
			// let content = fs.readFileSync("./Java_Code/Magician.java", "utf8");
			// let content = fs.readFileSync(path, "utf8");
			
			// let output = javaMethodParser(content);
			// output = JSON.stringify(output, null, 3);
			// fs.writeFileSync("./HasilParsing/Magician.json", output);

			res.end();
		}
		
	});

	server.listen(port, hostname, () => {
	  console.log(`Server running at http://${hostname}:${port}/`);
	});
})


