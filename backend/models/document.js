const mongoose = require('mongoose') ;

const docSchema = mongoose.Schema({
    title : String ,
    content : String ,
    ownerId : {
        type : mongoose.Schema.Types.ObjectId  ,
        ref : 'user'
    },
} , { timestamps: true }) ;

module.exports = mongoose.model('document' , docSchema) ;