const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const { check, validationResult } = require("express-validator");

//@route GET api/profile/me
//@desc  get current user profile
//@access Private

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      "user",
      ["name", "avatar"]
    );
    if (!profile) {
      return res
        .status(400)
        .json({ message: "There is no profile for this user" });
    }
    return res.status(200).json({ profile });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("server error");
  }
});

//@route GET api/profile
//@desc  create  or update user profile
//@access Private
router.post(
  "/",
  [
    authMiddleware,
    [
      //validation
      check("status", "status is required").not().isEmpty(),
      check("skills", "skills is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        err: errors.array(),
      });
    }

    const {
      company,
      website,
      location,
      status,
      skills,
      bio,
      githubUsername,
      youtube,
      twitter,
      facebook,
      linkedin,
      instagram,
    } = req.body;

    //build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (status) profileFields.status = status;
    if (bio) profileFields.bio = bio;
    if (githubUsername) profileFields.githubUsername = githubUsername;
    if (skills)
      profileFields.skills = skills.split(",").map((skill) => skill.trim());
    // console.log('skills',profileFields.skills);

    //build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      console.log("profile", profile);
      //if profile is found then update profile, if not found then create a new profile
      if (profile) {
        //update profile
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res
          .status(200)
          .json({ message: "profile updated successfully", profile });
      }
      //create a new profile
      profile = new Profile(profileFields);
      await profile.save();
      return res
        .status(200)
        .json({ message: "profile created successfully", profile });
    } catch (err) {
      console.err(err.message);
      return res.status(500).send("server error");
    }
  }
);

//@route GET api/profile
//@desc  get all profiles
//@access Public
router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    return res.status(200).json({ profiles });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("server error");
  }
});

//@route GET api/profile/user/:user_id
//@desc  get profile by user_id
//@access Public
router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);
    if (!profile) {
      res.status(400).json({ message: "profile not found" });
    }
    res.status(200).json({ profile });
  } catch (err) {
    console.error(err.message);
    if (err.kind == "ObjectId") {
      return res.status(400).json({ message: "profile not found" });
    }
    return res.status(500).send("server error");
  }
});

//@route DELETE api/profile
//@desc  delete user and profile and posts
//@access Private
router.delete("/", authMiddleware, async (req, res) => {
  try {
    //remove profile
    await Profile.findOneAndRemove({ user: req.user.id });
    //remove user
    await User.findOneAndRemove({ _id: req.user.id });
    return res.status(200).json({ message: "profile and user deleted" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("server error");
  }
});

//@route PUT api/profile/experience
//@desc  add profile experiences
//@access Private
router.put(
  "/experience",
  [
    authMiddleware,
    [
      //validation
      check("title", "title is required").not().isEmpty(),
      check("company", "company is required").not().isEmpty(),
      check("from", "from is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        err: errors.array(),
      });
    }
    try {
      const { title, company, from, to, location, current, description } =
        req.body;
      const newExp = {
        title,
        company,
        from,
        to,
        location,
        current,
        description,
      };
      let profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExp);
      await profile.save();
      return res.status(200).json({ updatedProfile: profile });
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("server error");
    }
  }
);
//@route DELETE api/profile/experience/:exp_id
//@desc  delete experience from profile
//@access Private
router.delete("/experience/:exp_id", authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    const removeIndex = profile.experience
      .map((exp) => exp._id)
      .indexOf(req.params.exp_id);
    profile.experience.splice(removeIndex, 1);
    await profile.save();
    return res.status(200).json({ profile });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("server error");
  }
});
module.exports = router;

//@route PUT api/profile/education
//@desc  add profile education
//@access Private
router.put(
  "/education",
  [
    authMiddleware,
    [
      //validation
      check("school", "school is required").not().isEmpty(),
      check("degree", "degree is required").not().isEmpty(),
      check("fieldOfStudy", "fieldOfStudy is required").not().isEmpty(),
      check("from", "from is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        err: errors.array(),
      });
    }
    try {
      const { school, degree, fieldOfStudy, from, to, current, description } =
        req.body;
      const newEdu = {
        school,
        degree,
        fieldOfStudy,
        from,
        to,
        current,
        description,
      };
      let profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEdu);
      await profile.save();
      return res.status(200).json({ updatedProfile: profile });
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("server error");
    }
  }
);
//@route DELETE api/profile/experience/:exp_id
//@desc  delete experience from profile
//@access Private
router.delete("/education/:edu_id", authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    const removeIndex = profile.education
      .map((edu_id) => edu_id._id)
      .indexOf(req.params.edu_id);
    profile.education.splice(removeIndex, 1);
    await profile.save();
    return res.status(200).json({ message: "deleted successfully", profile });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("server error");
  }
});
module.exports = router;
