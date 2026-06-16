const mongoose = require('mongoose') ;

const versionSchema = mongoose.Schema({
    documentId : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'document'
    } ,
    title : String ,
    content : String ,
} , { timestamps: true }) ;

module.exports = mongoose.model('version' , versionSchema) ;