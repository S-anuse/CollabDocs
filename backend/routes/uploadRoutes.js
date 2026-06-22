const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const isLoggedIn = require("../middleware/authMiddleware");

const { uploadImage } = require("../controllers/uploadController");

router.post(
  "/upload-image",
  isLoggedIn,
  upload.single("image"),
  uploadImage
);

module.exports = router;