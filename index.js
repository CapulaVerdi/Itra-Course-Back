import express from 'express'
import 'dotenv/config'
import attributeRouter from './routes/attribute.route.js';
import profileRouter from './routes/profile.route.js'
import { requireAuth } from './middleware/auth.js';
import cors from 'cors';

const app = express();

app.use(cors({
    origin: [
        'https://itra-course-front.vercel.app', 
        'http://localhost:5173'
    ]
}));

app.use(express.json())

app.use('/attributes', attributeRouter);
app.use('/profile', profileRouter);

app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === "P2002") {res.status(409).json({error: "already exists"}); return}
  if (err.code === "P2025") {res.status(404).json({error: "not found"}); return}
  if (err.code === "v409") {res.status(409).json({error: "version conflict"}); return}
  res.status(500).json({error: "Internal server error"});
});

app.listen(process.env.PORT, (err) => {
    if (err) {
        throw err;
    }
    console.log(`Server start at port: ${process.env.PORT}`)
})