const express = require('express')
require('dotenv').config()
const app = express()
app.get('/',(req,res)=>{
    res.send('hello')
})

const port = process.env.PORT 
app.listen(port, ()=>{
    console.log(`listening on port ${port}`)
})