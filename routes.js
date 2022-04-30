const Router = require('express').Router
const https = require('https')
const fs = require('fs')
const Youtube = require('youtube-stream-url')
const router = new Router()
const {spawn} = require('child_process')

router.get('/pull', async(req, res) =>{
    let name = req.query.name
    let ls = spawn(`D:/UnityProject/${name}/pull.cmd`)
    let log = ''
    ls.stdout.on("data", data => {
        console.log(`stdout: ${data}`)
        log += `stdout: ${data}\n`
    });

    ls.stderr.on("data", data => {
        console.log(`stderr: ${data}`)
        log += `stderr: ${data}\n`
    });

    ls.on('error', (error) => {
        console.log(`error: ${error.message}`)
        log += `error: ${error.message}\n`
    });

    ls.on("close", code => {
        console.log(`child process exited with code ${code}`)
        log += `Exited with code ${code}\n`
        res.send(log)
    });

})


router.get('/getVideo', (req, res) => {
    try{
        let url = req.query.url
        console.log(url)
        if (!url) res.json(['error : Empty request'])

        Youtube.getInfo({url}).then(video => {
            const fileName = `.\\static\\${video['videoDetails']['videoId']}.mp4`
            fs.access(fileName, fs.constants.F_OK, (err) => {
                if (err === null) {
                    let rs = fs.createReadStream(fileName)
                    let { size } = fs.statSync(fileName)
                    res.setHeader('Content-Type', 'video/mp4')
                    res.setHeader('Content-Length', size)
                    rs.on('finish', () => res.send('ok'))
                    rs.on('error', () => res.send('error'))
                    rs.pipe(res)
                }
                else {
                    let formats = Object.keys(video.formats).map(format => video.formats[format])
                    try {
                        let formatUrl = formats.find((format) => format['qualityLabel'].includes('360') && format['mimeType'].includes('mp4'))['url']
                        const request = https.get(formatUrl, response => {
                            if (response.statusCode === 200) {
                                const file = fs.createWriteStream(fileName, { flags: 'wx' })
                                file.on('error', err => {
                                    file.close()
                                    if (err.code === 'EEXIST') res.send('error')
                                    else fs.unlink(fileName, () => res.send('error'))
                                })
                                response.pipe(file)
                                response.pipe(res)
                            } else {
                                res.send(`Server responded with ${response.statusCode}: ${response.statusMessage}`)
                            }
                        })

                        request.on('error', err => {
                            res.send('error')
                        });

                    } catch (e){
                        console.log(e)
                        res.send(e)
                    }
                }
            })
        }).catch((e) => {
            res.send("Youtube Error")
        })
    }
    catch (e){
        res.send(e)
    }


})

router.get('/getAudio')

module.exports = router