const fs = require('fs');
const busboy = require('busboy');

const options = new Set();
module.exports = {
    setOptions: fieldsArray => {
        fieldsArray.filter(item => item.fieldName && item.fileName && item.filePath).forEach(item => { options.add(item) })
        return options
    },
    uploadFromDataUrl: async ({ dataUrl, fileName, filePath }) => {
        const { fileTypeFromBuffer } = await import('file-type');
        const data = dataUrl.replace(/^data:.*\/\w+;base64,/, "");
        const buf = Buffer.from(data, 'base64');
        const { ext, mime } = await fileTypeFromBuffer(buf);
        const file_name = `${fileName}.${ext}`;
        const file_path = `${filePath}/${file_name}`;
        try {
            fs.writeFileSync(`.${file_path}`, buf);
            return { path: file_path };

        } catch (error) {
            throw new Error(error);
        }
    },
    uploadFromBuffer: async ({ buffer, fileName, filePath }) => {
        console.log(Buffer.isBuffer(buffer))
        const { fileTypeFromBuffer } = await import('file-type');
        const { ext, mime } = await fileTypeFromBuffer(buffer);
        const file_name = `${fileName}.${ext}`;
        const file_path = `${filePath}/${file_name}`;
        try {
            fs.writeFileSync(`.${file_path}`, buffer);
            return { path: file_path };

        } catch (error) {
            throw new Error(error);
        }
    },
    parsFormData: (req, res, next) => {
        const bb = busboy({ headers: req.headers });
        const files = [];
        bb.on('file', (name, file, info) => {
            // const { filename, encoding, mimeType } = info;
            let buf = ''
            file.setEncoding('base64');
            file.on('data', (data) => {
                buf += data;
            }).on('close', async () => {
                const buffer = Buffer.from(buf, 'base64');
                const fileObj = {
                    fieldName: name,
                    ...info,
                    buffer
                }
                files.push(fileObj)
            });
        });
        bb.on('field', (name, val, info) => {
            req.body[name] = val;
        });
        bb.on('close', () => {
            req.files = files;
            next();
        });
        req.pipe(bb);
    },
    uploadFile: (req, res, next) => {
        const bb = busboy({ headers: req.headers });
        const files = [];
        bb.on('file', (name, file, info) => {
            const { filename, encoding, mimeType } = info;
            let buf = ''
            file.setEncoding('base64');
            file.on('data', (data) => {
                buf += data;
            }).on('close', async () => {
                try {
                    const buffer = Buffer.from(buf, 'base64');
                    const fileOptions = [...options].find(item => item.fieldName == name);
                    if (fileOptions) {
                        const { fieldName, fileName, filePath } = fileOptions
                        // const file = await module.exports.uploadFromBuffer({ buffer, fileName, filePath });
                        const fileObj = {
                            fieldName,
                            fileName,
                            filePath,
                            originalName: filename,
                            encoding,
                            mimeType,
                            buffer
                        }
                        files.push(fileObj)
                    }
                    else {
                        const fileObj = {
                            fieldName: name,
                            ...info,
                            buffer
                        }
                        files.push(fileObj)
                    }
                } catch (error) {
                    throw new Error(error);
                }
            });
        });
        bb.on('field', (name, val, info) => {
            req.body[name] = val;
        });
        bb.on('close', () => {
            req.files = files;
            next();
        });
        req.pipe(bb);
    }
}