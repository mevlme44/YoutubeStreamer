const Router = require('express').Router
const https = require('https')
const fs = require('fs')
const Youtube = require('youtube-stream-url')
const router = new Router()

router.get('/getVideo', (req, res) => {
    try{
        let url = req.body['url']
        console.log(url)
        if (!url) res.json(['error : Empty request'])

        Youtube.getInfo({url}).then(video => {
            let formats = Object.keys(video.formats).map(format => video.formats[format])
            try{
                let formatUrl = formats.find((format) => format['qualityLabel'].includes('360') && format['mimeType'].includes('mp4'))['url']
                download(formatUrl, `.\\static\\${video['videoDetails']['videoId']}.mp4`).then(() => {
                    res.send("ok")
                }).catch((e) => {
                    res.send(e)
                })
            }
            catch (e){
                console.log(e)
                res.send(e)
            }
        })
    }
    catch (e){
        res.send(e)
    }


})
router.get('/getAudio')

function download(url, dest) {
    return new Promise((resolve, reject) => {
        fs.access(dest, fs.constants.F_OK, (err) => {

            if (err === null) reject('File already exists');

            const request = https.get(url, response => {
                if (response.statusCode === 200) {

                    const file = fs.createWriteStream(dest, { flags: 'wx' });
                    file.on('finish', () => resolve());
                    file.on('error', err => {
                        file.close();
                        if (err.code === 'EEXIST') reject('File already exists');
                        else fs.unlink(dest, () => reject(err.message)); // Delete temp file
                    });
                    response.pipe(file);
                } else if (response.statusCode === 302 || response.statusCode === 301) {
                    download(response.headers.location, dest).then(() => resolve());
                } else {
                    reject(`Server responded with ${response.statusCode}: ${response.statusMessage}`);
                }
            });

            request.on('error', err => {
                reject(err.message);
            });
        });
    });
}

module.exports = router