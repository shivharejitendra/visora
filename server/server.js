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

// ⚠️ ADD THIS CORS MIDDLEWARE
app.use(
  cors({
    origin: [
      "http://localhost:5173",                // local dev
      "https://your-frontend-name.vercel.app" // update later when Vercel is live
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// (optional, but sometimes helps with preflight)
app.options("*", cors());
app.use('/api/user',userRouter);
app.use('/api/image',imageRouter);
app.get('/', (req, res) => res.send("API WORKING FINE"))

app.listen(PORT, () => console.log(`Server running on port`+ PORT));
