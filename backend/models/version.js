const mongoose = require('mongoose') ;

const versionSchema = mongoose.Schema({
    documentId : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'document'
    } ,
    authorId : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'user'
    } ,
    title : String ,
    content : String ,
    updatedAt : {
        type: Date,
        default: Date.now
    }
} , { timestamps: true }) ;

module.exports = mongoose.model('version' , versionSchema) ;