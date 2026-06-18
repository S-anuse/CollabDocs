require('dotenv').config();

const express = require('express') ;
const app = express() ;
const connectDB = require('./config/db') ;
const authRoutes = require('./routes/authRoutes') ;
const cookieParser = require('cookie-parser');
const cors = require("cors");

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api/auth" , authRoutes) ;

console.log("1");
connectDB();
console.log("2");



app.get('/', (req, res) => {
    console.log("Hey");
    res.send("Hey there! Your server is working."); 
});

app.listen(process.env.PORT , () => {
    console.log("Server is running");
    
}) ;