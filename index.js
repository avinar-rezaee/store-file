const fs = require('fs');
const busboy = require('busboy');
const { v4: uuidv4 } = require('uuid');
const options = new Set();

module.exports = {
    setOptions: fieldsArray => {
        fieldsArray.filter(item => item.fieldName && item.filePath).forEach(item => {
            options.forEach(elem => { if (elem.fieldName == item.fieldName) options.delete(elem) });
            options.add(item);
        });
        return options;
    },
    uploadFromDataUrl: async ({ dataUrl, fileName, filePath }) => {
        const dataUrlRegex = /^data:.*\/\w+;base64,([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
        if (!dataUrlRegex.test(dataUrl)) throw new Error('dataUrl field must be DataUrl')
        const { fileTypeFromBuffer } = await import('file-type');
        const data = dataUrl.replace(/^data:.*\/\w+;base64,/, "");
        const buf = Buffer.from(data, 'base64');
        const { ext, mime } = await fileTypeFromBuffer(buf);
        const file_name = `${fileName ?? uuidv4()}.${ext}`;
        const file_path = `${filePath}/${file_name}`;
        try {
            fs.writeFileSync(`.${file_path}`, buf);
            return { filePath: file_path };

        } catch (error) {
            throw new Error(error);
        }
    },
    uploadFromBuffer: async ({ buffer, fileName, filePath }) => {
        if (!Buffer.isBuffer(buffer)) throw new Error('buffer field must be Buffer')
        const { fileTypeFromBuffer } = await import('file-type');
        const { ext, mime } = await fileTypeFromBuffer(buffer);
        const file_name = `${fileName ?? uuidv4()}.${ext}`;
        const file_path = `${filePath}/${file_name}`;
        try {
            fs.writeFileSync(`.${file_path}`, buffer);
            return { filePath: file_path };

        } catch (error) {
            throw new Error(error);
        }
    },
    parsFormData: (req, res, next) => {
        const bb = busboy({ headers: req.headers });
        const files = [];
        bb.on('file', (name, file, info) => {
            const { filename, encoding, mimeType } = info;
            let buf = ''
            file.setEncoding('base64');
            file.on('data', (data) => {
                buf += data;
            }).on('close', () => {
                const buffer = Buffer.from(buf, 'base64');
                const fileObj = {
                    fieldName: name,
                    originalName: filename,
                    encoding,
                    mimeType,
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
            }).on('close', () => {
                const buffer = Buffer.from(buf, 'base64');
                const fileOptions = [...options].find(item => item.fieldName == name);
                if (fileOptions) {
                    const { fieldName, fileName, filePath: path } = fileOptions;
                    const fileObj = {
                        fieldName,
                        fileName: fileName ?? uuidv4(),
                        path,
                        originalName: filename,
                        encoding,
                        mimeType,
                        buffer
                    }
                    files.push(fileObj)
                }
            });
        });
        bb.on('field', (name, val, info) => {
            req.body[name] = val;
        });
        bb.on('close', async () => {
            const uploadedFiles = [];
            try {
                for (const item of files) {
                    const { buffer, fileName, path } = item
                    const file = await module.exports.uploadFromBuffer({ buffer, fileName, filePath: path });
                    item['filePath'] = file.filePath;
                    uploadedFiles.push(item);
                }

            } catch (error) {
                throw new Error(error);
            }
            req.files = uploadedFiles;
            next();
        });
        req.pipe(bb);
    }
}