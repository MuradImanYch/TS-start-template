import "dotenv/config";
import express from "express";
const app = express();
import cors from "cors";
const PORT = process.env.PORT;
import auth from './routes/auth.js';
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', auth);
app.listen(PORT, () => {
    console.log(`✅ Server is running on ${PORT}`);
});
