require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors(
    {
        origin:process.env.FRONTEND_URL,
        credentials:true
    }
));

app.use(express.json());

app.get('/health', (req, res)=>{
    res.status(200).json({
        success:true,
        message:"Server is healthy"
    });
})

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
})