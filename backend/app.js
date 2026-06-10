require('dotenv').config();
const express = require('express') ;
const app = express() ;
const connectDB = require('./config/db') ;

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