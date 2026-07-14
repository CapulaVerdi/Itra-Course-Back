import express from 'express'
import 'dotenv/config'

const app = express();

app.listen(process.env.PORT, (err) => {
    if (err) {
        throw err;
    }
    console.log(`Server start at port: ${process.env.PORT}`)
})