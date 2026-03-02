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

const authRoutes = require('./src/routes/auth.routes');
app.use('/api/v1/auth', authRoutes);

app.use((err, req, res, next) => {
  const status = err.status || 500;

  res.status(status).json({
    success: false,
    error: err.message || "Internal Server Error"
  });
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
})