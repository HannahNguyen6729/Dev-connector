const express = require("express");
const router = express.Router();

const { check, validationResult } = require("express-validator");
const User = require("../../models/User");
const authMiddleware = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const Post = require("../../models/Post");

//@route GET api/posts
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
      console.error(err);
    }
  }
);

module.exports = router;
