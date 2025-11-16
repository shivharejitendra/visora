import exppress from 'express';
import cors from 'cors';
import 'dotenv/config';
import userRouter from './routes/userRoutes.js';
import imageRouter from './routes/imageRoutes.js';
import connectDB from './config/mongodb.js';




const app = exppress();
const PORT = process.env.PORT || 4000;

app.use(exppress.json());
app.use(cors());
await connectDB();


app.use('/api/user',userRouter);
app.use('/api/image',imageRouter);
app.get('/', (req, res) => res.send("API WORKING FINE"))

app.listen(PORT, () => console.log(`Server running on port`+ PORT));
