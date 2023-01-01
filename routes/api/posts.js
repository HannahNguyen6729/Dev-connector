const express = require("express");
const router = express.Router();

const { check, validationResult } = require("express-validator");
const User = require("../../models/User");
const authMiddleware = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const Post = require("../../models/Post");

//@route POST api/posts
//@desc  create a new post
//@access Private
router.post(
  "/",
  [
    authMiddleware,
    //validation
    [check("text", "text is required").not().isEmpty()],
  ],
  async (req, res) => {
    //validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        err: errors.array(),
      });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");
      const newPost = await new Post({
        // user: user._id,
        user: req.user.id,
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
      });
      const post = await newPost.save();
      return res.status(200).json(post);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("server error");
    }
  }
);

//@route GET api/posts
//@desc  get all posts
//@access Private
router.get("/", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    return res.status(200).json(posts);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("server error");
  }
});

//@route GET api/posts/:id
//@desc  get a post by id
//@access Private
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "No post found" });
    return res.status(200).json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "No post found" });
    }
    return res.status(500).send("server error");
  }
});

//@route DELETE api/posts/:id
//@desc  delete a post by id
//@access Private
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "No post found" });
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "user not authorized" });
    }
    await post.remove();
    return res
      .status(200)
      .json({ msg: "post is removed successfully", removedPost: post });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "No post found" });
    }
    return res.status(500).send("server error");
  }
});

//@route PUT api/posts/like/:id
//@desc  like a post (id is postId)
//@access Private
router.put("/like/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //check if the post has been already liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: "post has already been liked" });
    }

    post.likes.unshift({ user: req.user.id });
    await post.save();
    return res.status(200).json(post.likes);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("server error");
  }
});

//@route PUT api/posts/unlike/:id
//@desc  unlike a post (id is postId)
//@access Private
router.put("/unlike/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //check if the post has been already liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: "post has not been liked" });
    }

    //get remove index
    const removeIndex = post.likes.map((like) =>
      like.user.toString().indexOf(req.user.id)
    );
    post.likes.splice(removeIndex, 1);
    await post.save();
    return res.status(200).json(post.likes);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("server error");
  }
});

//@route POST api/posts/comment/:id
//@desc  comment on a post
//@access Private
router.post(
  "/comment/:id",
  [
    authMiddleware,
    //validation
    [check("text", "text is required").not().isEmpty()],
  ],
  async (req, res) => {
    //validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        err: errors.array(),
      });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");
      const post = await Post.findById(req.params.id);
      const newComment = {
        user: req.user.id,
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
      };
      post.comments.unshift(newComment);
      post.save();
      return res.status(200).json(post.comments);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("server error");
    }
  }
);

//@route DELETE api/posts/comment/:id/:comment_id
//@desc  delete a comment (by postId && commentId)
//@access Private
router.delete("/comment/:id/:comment_id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //pull out comment
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );
    //check if comment exists
    if (!comment) {
      return res.status(404).json({ msg: "Comment does not exist" });
    }
    //check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "user not authorized" });
    }

    //get remove index
    const removeIndex = post.comments.map((comment) =>
      comment.user.toString().indexOf(req.user.id)
    );
    post.comments.splice(removeIndex, 1);

    await post.save();
    return res.status(200).json(post.comments);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("server error");
  }
});
module.exports = router;
