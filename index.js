import express from 'express'
import 'dotenv/config'
import attributeRouter from './routes/attribute.route.js';
import { requireAuth } from './middleware/auth.js';

const app = express();

app.use(express.json())

app.use('/attributes', attributeRouter, );

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({error: "Internal server error"});
});

app.listen(process.env.PORT, (err) => {
    if (err) {
        throw err;
    }
    console.log(`Server start at port: ${process.env.PORT}`)
})