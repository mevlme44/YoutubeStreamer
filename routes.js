const Router = require('express').Router
const Stream = require('./Stream')
const https = require('https')
const fs = require('fs')
const Youtube = require('youtube-stream-url')
const router = new Router()
const clientRouter = new Router()
const streams = new Array()
console.log('\x1Bc');

clientRouter.get('/', (req, res) =>{
    res.sendFile('index.html', {root: 'client'})
})
clientRouter.get('/stream', (req, res) =>{
    res.sendFile('stream.html', {root: 'client'})
})

router.get('/getVideo', (req, res) => {
    const chunk = 10**6
    try{
        let url = req.query.url
        if (!url) {
            res.status(400).json(['error : Empty request'])
            return
        }
        Youtube.getInfo({url}).then(video => {
            //const fileName = `.\\static\\${video['videoDetails']['videoId']}.mp4`
            let videoId = video['videoDetails']['videoId']
            let userId = req.query.userId
            let disable = req.query['isDisable']
            let i = streams.indexOf(streams.find(stream => stream.userId === userId))
            if (disable) {
                if (i !== -1) {
                    streams.splice(i, 1)
                    res.status(200).send('Disabled')
                    console.log('\nstreams:')
                    streams.forEach(s => console.log(s.videoId))
                    return
                }else{
                    res.status(400).send('Cant find index')
                    return
                }
            }

            if (streams.find(s => s.userId === userId) && i !== -1){
                streams.splice(i, 1)
            }
            // fs.access(fileName, fs.constants.F_OK, (err) => {
            //     if (err === null) {
            //         const range = req.headers.range
            //         if (!range) {
            //             res.status(400).send('Requires range header')
            //             console.log('headers')
            //             return
            //         }
            //         const start = Number(range.replace(/\D/g,''))
            //         let size = fs.statSync(fileName).size
            //         let end = Math.min(start + chunk, size - 1);
            //         let contentLength = end-start + 1
            //         let headers = {
            //             'Content-Range': `bytes ${start}-${end}/${size}`,
            //             'Accept-Ranges': 'bytes',
            //             'Content-Length': contentLength,
            //             'Content-Type': 'video/mp4',
            //         }
            //         res.writeHead(206, headers)
            //         let rs = fs.createReadStream(fileName, {start, end})
            //         rs.pipe(res)
            //     }
            //     else {
                    let formats = Object.keys(video.formats).map(format => video.formats[format])
                    try {
                        let formatUrl = formats.find((format) => format['qualityLabel'].includes('720') && format['mimeType'].includes('mp4'))['url']
                        const request = https.get(formatUrl, response => {
                            if (response.statusCode === 200) {
                                //const file = fs.createWriteStream(fileName)
                                //file.on('error', err => {
                                    //file.close()
                                    //if (err.code === 'EEXIST') res.send('error')
                                    //else fs.unlink(fileName, () => res.send('error'))
                                //})
                                //let headers = {
                                    //'Content-Type': 'video/mp4',
                                //}
                                //res.writeHead(206, headers)
                                //response.pipe(file)
                                //let rs = fs.createReadStream(fileName)

                                let i = streams.indexOf(streams.find(stream => stream.videoId === videoId && stream.userId === userId))
                                if (i === -1) {
                                    res.setHeader('Content-Type', 'video/mp4')
                                    response.pipe(res)
                                    streams.push(new Stream(userId, videoId, response))

                                }
                                else {
                                    res.status(400).send('video is coming')
                                }
                            } else {
                                res.status(400).send(`Server responded with ${response.statusCode}: ${response.statusMessage}`)
                            }
                            console.log('\nstreams:')
                            streams.forEach(s => console.log(s.videoId))
                        })

                        request.on('error', err => {
                            res.status(400).send('error')
                        });

                    } catch (e){
                        res.status(400).send(e)
                    }
            //     }
            // })
        }).catch((e) => {
            res.status(400).send("Youtube Error")
            console.log(e)
        })
    }
    catch (e){
        res.send(e)
    }
})

router.get('/getStream', (req, res) => {
    let uid = req.query.userId
    let stream = streams.find(s => s.userId === uid)

    if (!stream){
        res.status(400).send('No video')
        return
    }

})

module.exports = {
    router,
    clientRouter
}