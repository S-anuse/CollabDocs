const userModel = require('../models/user') ;
const documentModel = require('../models/document') ;
const bcrypt = require('bcrypt') ;
const jwt = require('jsonwebtoken') ;
require('dotenv').config();

const register = async (req , res) => {
    const {name , email , password} = req.body ;
    try {
        if(!name || !email || !password) return res.status(400).json({message : "Enter the data first"}) ;
        let isAlready = await userModel.findOne({email}) ;
        if(isAlready) return res.status(409).json({message : "User Already Exist"}) ;
        let salt = await bcrypt.genSalt(10) ;
        let hash = await bcrypt.hash(password , salt) ;
        let user = await userModel.create({
            name ,
            email , 
            password : hash
        })
        res.status(201).json({message : "User registered successfully"}) 
    }
    catch(err) {
        return res.status(500).json({message:err.message}) ;
    }
    

}

const login = async (req , res) => {
    const {email , password} = req.body ;
    try {
        let user = await userModel.findOne({email}) ;
        if(!user) return res.status(400).json({message:"User desn't exist"}) ;
        let result = await bcrypt.compare(password , user.password) ;
        if(!result) return res.status(401).json({message:"Invalid Password"}) ;
        const accessToken = jwt.sign({email , userid : user._id} , process.env.JWT_SECRET , { expiresIn: '15m' }) ;
        const refreshToken = jwt.sign({email , userid : user._id} , process.env.JWT_SECRET , { expiresIn: '7d' }) ;
        res.cookie('refreshToken' , refreshToken , {httpOnly: true}) ;
        res.status(200).json({message:"Login Successful" , accessToken}) ;
    }
    catch(err) {
        return res.status(500).json({message:err.message}) ;
    }
    
}

const profile = async(req , res) => {
    let user = await userModel.findOne({_id : req.user.userid}) ;
    res.json({name: user.name , email: user.email});
}

const logout = async (req , res) => {
    try {
        res.clearCookie('refreshToken'); 
        res.json({message:"User Logged out successfully"}) ;
    }
    catch(err) {
        return res.status(401).json({message : "Logout Failed"}) ;
    }
}

const refreshToken = async (req , res) => {
    if(!req.cookies.refreshToken) return res.status(401).json({message : "Refresh token missing"}) ;
    try {
        let data = jwt.verify(req.cookies.refreshToken , process.env.JWT_SECRET ) ;
        req.user = data ;
        let accessToken = jwt.sign({email : req.user.email , userid:req.user.userid} , process.env.JWT_SECRET , {expiresIn : '15m'} ) ;
        res.json({accessToken}) ;
    }
    catch(err) {
        return res.status(401).json({message : err.message}) ;
    }
}


module.exports = { register , login , profile , logout , refreshToken};