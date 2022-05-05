require('dotenv').config()
const express = require('express')
const routers = require('./routes')

const PORT = process.env.PORT || 5000
const app = express()

app.use(express.json())
app.use('/api', routers.router)
app.use('/', routers.clientRouter)

const start = () => {
    try{
        app.listen(PORT, () => console.log(`server started on port ${PORT}`))
    }
    catch (e){
        console.log(e)
    }
}

start()