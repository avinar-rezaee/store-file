## About this package	

**with this package you can upload file from either formdata, or dataUrl or buffer.
you can also parse formdata fields and files with this pakage.**

these two awesome following packages are used in this package

[uuid](https://www.npmjs.com/package/uuid)
[busboy](https://www.npmjs.com/package/busboy)

## Get started

	npm i store-file --save

## Examples

we use express server for examples.
```javascript
    const { uploadFile, setOptions } = require('store-file');

	setOptions([{ fieldName: 'filetoupload', filePath: '/public',fileName: 'name'}]);
	//or
	setOptions([{ fieldName: 'filetoupload', filePath: '/public'}]);
	// in this case name would be a random and unique string like 86c62f37-05fb-4662-bcdf-1c1603f49ce9
	// uuid package is used for names
        app.post('/upload', uploadFile, (req, res) => {
		console.log(req.body);// including form data fields
		//result of req.body
		// {foo:'bar'}		
		console.log(req.files);// array of uploaded files
		//result of req.files
		//[{
		//     fieldName: 'a',
		//     fileName: '86c62f37-05fb-4662-bcdf-1c1603f49ce9',
		//     filePath: '/public',
		//     originalName: 'iSSTP_v1.3_20161009.zip',
		//     encoding: '7bit',
		//     mimeType: 'application/zip',
		//     buffer: <Buffer 50 4b 03 04 0a 00 00 00 00 00 88 bd 44 49 00 00 00 00 00 00 00 00 00 00 00 00 0a 00 10 00 69 53 73 74 70 2e 61 70 70 2f 55 58 0c 00 13 c4 f9 57 3f c0 ... 4417684 more bytes>
		//}]

		res.end();
	});
```
**and on front end** 

```javascript
	const [file] = document.querySelector('.file').files;
	const  formData = new  FormData();
	formData.append('filetoupload', file);
	formData.append('foo', 'bar');
	$.ajax({
		url:  `/upload`,
		type:  'POST',
		data:  formData,
		cache:  false,
		enctype:  'multipart/form-data',
		contentType:  false,
		processData:  false,
	}).done(data  => {
		console.log(data);
	});
```

or you can also parse form data and store the file 

```javascript
	const { parsFormData, uploadFromBuffer, uploadFromDataUrl } = require('store-file');
	app.post('/upload', parsFormData, async (req, res) => {
		console.log(req.files);
		//[{
		//	fieldName:  'a',
		//	originalName:  'something.zip',
		//	encoding:  '7bit',
		//	mimeType:  'application/zip',
		//	buffer:  <Buffer  50  4b  03  04  0a  00  00  00  00  00  88  bd  44  49  00  00  00  00  00  00  00  00  00  00  00  00  0a  00  10  00  69  53  73  74  70  2e  61  70  70  2f  55  58  0c  00  13  c4  f9  57  3f  c0  ...  4417684  more  bytes>
		//}]
		const { buffer } = req.files[0]
		const { filePath } = await uploadFromBuffer({ buffer , fileName: 'name', filePath: '/public' });
		//{ filePath: '/public/b243610d-ba38-474b-aa51-45f6ac3d07da.zip' }

		//or you can also store dataUrl

		const { filePath } = await uploadFromDataUrl({ dataUrl:data_url , fileName: 'name', filePath: '/public' });
		
	
	});
```
