const express = require("express");
const multer = require("multer");
const path = require("path");
const Blog = require("../models/Blog");
const mongoose = require("mongoose");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    const image = req.file ? req.file.filename : null;

    const newBlog = new Blog({ title, description, image });
    await newBlog.save();
    res.status(201).json(newBlog);
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({ message: "Failed to create blog" });
  }
});

router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("comments.user", "username")
      .populate("comments.replies.user", "username");
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json(blog);
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({ message: "Error fetching blog" });
  }
});

router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    const image = req.file ? req.file.filename : null;

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    blog.title = title || blog.title;
    blog.description = description || blog.description;
    blog.image = image || blog.image;

    await blog.save();
    res.json(blog);
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({ message: "Error updating blog" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ message: "Error deleting blog" });
  }
});

router.post("/:blogId/comments", async (req, res) => {
  try {
    const { text, userId } = req.body;
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const newComment = { user: userId, text };
    blog.comments.push(newComment);
    await blog.save();

    await blog.populate("comments.user", "username");
    res.status(201).json(blog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/:blogId/comments/:commentId/replies", async (req, res) => {
  try {
    const { text, userId } = req.body;
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const comment = blog.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const newReply = { user: userId, text };
    comment.replies.push(newReply);
    await blog.save();

    await blog.populate("comments.replies.user", "username");
    const savedReply = comment.replies[comment.replies.length - 1];
    res.status(201).json(savedReply);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;