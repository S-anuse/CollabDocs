const mongoose = require('mongoose') ;

const shareSchema = mongoose.Schema({
    documentId : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'document'
    } ,
    userId : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : 'user'

    } ,
    permission : { 
    type: String, 
    enum: ['viewer', 'editor'], 
    default: 'viewer' 
  }
}) ;

module.exports = mongoose.model('shareddocument' , shareSchema) ;