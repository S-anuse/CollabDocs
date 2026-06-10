// require('dotenv').config();
const express = require('express') ;
const app = express() ;

app.get('/', (req, res) => {
    console.log("Hey");
    res.send("Hey there! Your server is working."); 
});

app.listen(3000) ;