const documentModel = require("../models/document");
const userModel = require("../models/user");
const versionModel = require("../models/version");
const shareddocumentModel = require("../models/shareddocument");
require("dotenv").config();

const documents = async (req, res) => {
  const { title, content } = req.body;
  try {
    let ownerId = req.user.userid;
    let document = await documentModel.create({
      title,
      content,
      ownerId,
    });
    res.status(201).json({ message: "Dcument Created successfully", document });
  } catch (err) {
    return res.status(500).json(err.message);
  }
};

const getdocuments = async (req, res) => {
  try {
    let ownDocuments = await documentModel.find({ ownerId: req.user.userid }).lean();
    let sharedDocuments = await shareddocumentModel
      .find({ userId: req.user.userid })
      .populate("documentId")
      .lean();
    
    const ownDocsWithPerm = ownDocuments.map((doc) => ({
      ...doc,
      permission: "owner",
    }));
    
    const sharedDocsWithPerm = sharedDocuments
      .filter((ele) => ele.documentId)
      .map((ele) => ({
        ...ele.documentId,
        permission: ele.permission,
      }));
      
    const combinedDocumentId = [...ownDocsWithPerm, ...sharedDocsWithPerm];
    res
      .status(200)
      .json({ message: "Documents are found", combinedDocumentId });
  } catch (err) {
    res.status(500).json(err.message);
  }
};

const returndocument = async (req, res) => {
  try {
    let document = await documentModel.findOne({ _id: req.params.id });
    if (!document)
      return res.status(404).json({ message: "Document does not exist" });
    if (document.ownerId.toString() == req.user.userid)
      return res
        .status(200)
        .json({ message: "Document Found", document, permission: "owner" });
    let sharedDocument = await shareddocumentModel.findOne({
      documentId: req.params.id,
      userId: req.user.userid,
    });
    if (!sharedDocument)
      return res.status(403).json({ message: "User has no permission." });
    return res
      .status(200)
      .json({
        message: "Document Found",
        document,
        permission: sharedDocument.permission,
      });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

const SESSION_GAP_MS = 10 * 60 * 1000; // 10 minutes session window

const updatedocument = async (req, res) => {
  try {
    let canEdit = false;
    const document = await documentModel.findOne({ _id: req.params.id });
    if (!document)
      return res.status(404).json({ message: "Document does not exist" });

    if (document.ownerId.toString() == req.user.userid) canEdit = true;

    if (!canEdit) {
      let sharedDocument = await shareddocumentModel.findOne({
        documentId: req.params.id,
        userId: req.user.userid,
      });
      if (!sharedDocument)
        return res.status(403).json({ message: "User has no permission." });
      if (sharedDocument.permission == "editor") canEdit = true;
      else return res.status(403).json({ message: "User has no permission." });
    }

    if (canEdit) {
      const clean = (s) => (s || "").trim();

      // Guard 1: If incoming payload is identical to current DB document, exit immediately
      if (
        clean(document.title) === clean(req.body.title) &&
        clean(document.content) === clean(req.body.content)
      ) {
        return res.json(document);
      }

      // Guard 2: Check if a version with this EXACT title & content already exists anywhere in DB
      const existingVersionWithSameContent = await versionModel.findOne({
        documentId: req.params.id,
        title: document.title,
        content: document.content,
      });

      const lastVersion = await versionModel
        .findOne({ documentId: req.params.id })
        .sort({ updatedAt: -1, createdAt: -1 });

      const now = new Date();
      const lastTime = lastVersion
        ? new Date(lastVersion.updatedAt || lastVersion.createdAt).getTime()
        : 0;
      const withinSession = lastVersion && now.getTime() - lastTime < SESSION_GAP_MS;

      if (existingVersionWithSameContent) {
        // Content already exists as an earlier version: update timestamp & author without creating a duplicate row
        existingVersionWithSameContent.updatedAt = now;
        existingVersionWithSameContent.authorId = req.user.userid;
        await existingVersionWithSameContent.save();
      } else if (withinSession && lastVersion) {
        // Active editing session (<10 min gap): update current active session version checkpoint
        lastVersion.updatedAt = now;
        lastVersion.authorId = req.user.userid;
        await lastVersion.save();
      } else {
        // New session & unique content: create a new checkpoint snapshot
        await versionModel.create({
          documentId: req.params.id,
          authorId: req.user.userid,
          title: document.title,
          content: document.content,
          updatedAt: now,
        });
      }

      document.title = req.body.title;
      document.content = req.body.content;
      await document.save();
      return res.json(document);
    }
  } catch (err) {
    return res.status(500).json(err.message);
  }
};

const deletedocument = async (req, res) => {
  try {
    let document = await documentModel.findOne({ _id: req.params.id });

    if (!document)
      return res.status(404).json({ message: "document doesn't exist" });

    if (document.ownerId.toString() != req.user.userid)
      return res.status(403).json({ message: "No access" });

    await documentModel.findOneAndDelete({ _id: req.params.id });

    await shareddocumentModel.deleteMany({ documentId: req.params.id });

    await versionModel.deleteMany({ documentId: req.params.id });

    res.status(200).json({ message: "Deleted Successfully" });
  } catch (err) {
    return res.json(err.message);
  }
};

const shareDocument = async (req, res) => {
  const { documentId, email, permission } = req.body;
  try {
    let document = await documentModel.findOne({ _id: documentId });
    if (!document)
      return res.status(404).json({ message: "Document not found" });
    if (document.ownerId.toString() != req.user.userid)
      return res
        .status(403)
        .json({ message: "Sorry ! you can not share this document" });
    let user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    let isAlready = await shareddocumentModel.findOne({
      documentId,
      userId: user._id,
    });
    if (isAlready)
      await shareddocumentModel.findOneAndUpdate(
        { documentId, userId: user._id },
        { permission: permission },
      );
    else {
      if (req.user.userid != user._id.toString()) {
        await shareddocumentModel.create({
          documentId,
          userId: user._id,
          permission,
        });
      } else
        return res
          .status(403)
          .json({ message: "You cannot share a document with yourself" });
    }
    return res.status(200).json({ message: "Document shared successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const sharedusers = async (req, res) => {
  try {
    let document = await documentModel.findOne({ _id: req.params.id });
    if (!document)
      return res.status(404).json({ message: "No Document found" });
    if (document.ownerId.toString() != req.user.userid)
      return res.status(403).json({ message: "Sorry you are not the owner" });
    let users = await shareddocumentModel
      .find({ documentId: req.params.id })
      .populate("userId");
    if (users.length == 0) return res.status(200).json([]);
    let users_Array = users.map((ele) => {
      return {
        userId: ele.userId._id,
        name: ele.userId.name,
        email: ele.userId.email,
        permission: ele.permission,
      };
    });
    return res.status(200).json(users_Array);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const removeaccess = async (req, res) => {
  const { userId } = req.body;
  try {
    let document = await documentModel.findOne({ _id: req.params.id });
    if (!document)
      return res.status(404).json({ message: "No Document found" });
    if (document.ownerId.toString() != req.user.userid)
      return res.status(403).json({ message: "Sorry you are not the owner" });
    let sharedDocument = await shareddocumentModel.findOne({
      documentId: req.params.id,
      userId,
    });
    if (!sharedDocument)
      return res
        .status(404)
        .json({ message: "This document is not shared with this user" });
    await shareddocumentModel.findOneAndDelete({
      documentId: req.params.id,
      userId,
    });
    return res.status(200).json({ message: "Access Removed successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const versions = async (req, res) => {
  try {
    let canSee = false;
    const document = await documentModel.findOne({ _id: req.params.id });
    if (!document)
      return res.status(404).json({ message: "Document does not exist" });

    if (document.ownerId.toString() == req.user.userid) canSee = true;

    if (!canSee) {
      let sharedDocument = await shareddocumentModel.findOne({
        documentId: req.params.id,
        userId: req.user.userid,
      });
      if (!sharedDocument)
        return res.status(403).json({ message: "User has no permission." });
      canSee = true;
    }

    if (canSee) {
      const rawVersions = await versionModel
        .find({ documentId: req.params.id })
        .populate("authorId", "name email")
        .sort({ updatedAt: -1, createdAt: -1 });

      if (rawVersions.length == 0)
        return res
          .status(404)
          .json({ message: "No record found for this document" });

      // Deduplicate ALL versions so that every displayed version snapshot has UNIQUE content
      const clean = (s) => (s || "").trim();
      const versions = [];
      const seenKeys = new Set();

      for (const v of rawVersions) {
        const key = `${clean(v.title)}::${clean(v.content)}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          versions.push(v);
        }
      }

      return res.status(200).json(versions);
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const restoreversion = async (req, res) => {
  const { versionId } = req.body;
  try {
    let version = await versionModel.findOne({
      _id: versionId,
      documentId: req.params.id,
    });
    if (!version)
      return res
        .status(404)
        .json({ message: "This version is not available " });
    let document = await documentModel.findOne({ _id: req.params.id });
    if (!document)
      return res.status(404).json({ message: "Document does not exist" });
    if (document.ownerId.toString() != req.user.userid)
      return res.status(403).json({ message: "Sorry you are not the owner" });
    await versionModel.create({
      documentId: req.params.id,
      authorId: req.user.userid,
      title: document.title,
      content: document.content,
      updatedAt: new Date(),
    });
    document.title = version.title;
    document.content = version.content;
    await document.save();
    return res.status(200).json(document);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  documents,
  getdocuments,
  returndocument,
  updatedocument,
  deletedocument,
  shareDocument,
  sharedusers,
  removeaccess,
  versions,
  restoreversion,
};
