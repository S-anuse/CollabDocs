const express = require('express') ;
const router = express.Router() ;
const {register , login , profile , logout , refreshToken} = require('../controllers/authController') ;
const {documents , getdocuments , returndocument , updatedocument , deletedocument} = require('../controllers/documentController') ;
const isLoggedIn = require('../middleware/authMiddleware') ;

router.post('/register' , register) ;
router.post('/login' , login) ;
router.get('/profile' , isLoggedIn , profile) ;
router.post('/logout' , logout) ;
router.post('/refreshToken' , refreshToken) ;
router.post('/documents' , isLoggedIn , documents) ;
router.get('/documents' , isLoggedIn , getdocuments) ;
router.get('/documents/:id' , isLoggedIn , returndocument) ;
router.put('/documents/:id' , isLoggedIn , updatedocument) ;
router.delete('/documents/:id' , isLoggedIn , deletedocument) ;

module.exports = router ;