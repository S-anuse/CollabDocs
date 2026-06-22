const cloudinary = require("../config/cloudinary");

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const base64String =
      `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64String, {
      folder: "collabdocs",
    });

    return res.status(200).json({
      imageUrl: result.secure_url,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Image upload failed",
    });
  }
};

module.exports = { uploadImage };