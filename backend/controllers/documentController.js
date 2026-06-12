const documentModel = require('../models/document') ;
const shareddocumentModel = require('../models/shareddocument') ;
require('dotenv').config();


const documents = async (req , res) => {
    const {title , content } = req.body ;
    try {
        let ownerId = req.user.userid ;
        let document = await documentModel.create({
            title ,
            content ,
            ownerId 
        }) ;
        res.status(201).json({message : "Dcument Created successfully" , document}) ;
    }
    catch(err) {
        return res.status(500).json(err.message) ;
    }
}

const getdocuments = async (req , res) => {
    try {
        let ownDocuments = await documentModel.find({ownerId : req.user.userid}) ;
        let sharedDocuments = await shareddocumentModel.find({userId : req.user.userid}).populate('documentId') ;
        const sharedDocsOnly = sharedDocuments.map((ele) => {
            return ele.documentId
        }) ;
        const combinedDocumentId = [...ownDocuments, ...sharedDocsOnly] ;
        res.status(200).json({message:"Documents are found" , combinedDocumentId }) ;
    }
    catch(err) {
        res.status(500).json(err.message) ;
    }
    
}

const returndocument = async (req , res) => {
    try {
        let document = await documentModel.findOne({_id : req.params.id}) ;
        if(!document) return res.status(404).json({message : "Document does not exist"}) ;
        if(document.ownerId == req.user.userid) return res.status(200).json(document) ;
        let sharedDocument = await shareddocumentModel.findOne({documentId : req.params.id , userId : req.user.userid}) ;
        if(!sharedDocument) return res.status(403).json({message : "User has no permission."}) ;
        res.json({message : "Document Found" , document}) ;
    }
    catch(err) {
        return res.json(err.message) ;
    }
}

const updatedocument = async (req , res) => {
    try {
        let canEdit = false ;
        const document = await documentModel.findOne({_id : req.params.id}) ;
        if(!document) return res.status(404).json({message : "Document does not exist"}) ;

        if(document.ownerId.toString() == req.user.userid) canEdit = true ;

        if(!canEdit) {
            let sharedDocument = await shareddocumentModel.findOne({documentId : req.params.id , userId : req.user.userid}) ;
            if(!sharedDocument) return res.status(403).json({message : "User has no permission."}) ;
            if(sharedDocument.permission == "editor") canEdit = true ;
            else return res.status(403).json({message : "User has no permission."})
        }

        if(canEdit) {
            document.title = req.body.title ;
            document.content = req.body.content ;
            await document.save() ;
            return res.json(document) ;
        }
    }
    catch(err) {
        return res.status(500).json(err.message) ;
    }
}

const deletedocument = async (req , res) => {
    try {
        let document = await documentModel.findOne({_id : req.params.id}) ;

        if(!document) return res.status(404).json({message : "document doesn't exist"}) ;

        if(document.ownerId.toString() != req.user.userid) return res.status(403).json({message : "No access"}) ;

        await documentModel.findOneAndDelete({_id : req.params.id}) ;

        await shareddocumentModel.deleteMany({documentId : req.params.id}) ;

        res.status(200).json({message : "Deleted Successfully"}) ;

    }
    catch(err) {
        return res.json(err.message) ;
    }
}

module.exports = {documents , getdocuments , returndocument , updatedocument , deletedocument} ;