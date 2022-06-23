var express = require("express");
var router = express.Router();
var mongo = require("mongodb");
var db = require("monk")("localhost/nodeblog");
var multer = require("multer");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

var upload = multer({ storage: storage });

router.get("/show/:category", function (req, res, next) {
  var db = req.db;
  var posts = db.get("posts");
  posts.find({ category: req.params.category }, {}, function (err, posts) {
    res.render("index", {
      title: req.params.category,
      posts: posts,
    });
  });
});

router.get("/add", function (req, res, next) {
  res.render("addcategory", {
    title: "Add Category",
  });
});

router.post("/add", upload.single(), function (req, res, next) {
  // Get form values
  var title = req.body.title;
  console.log(title);

  // form Validation
  req.checkBody("title", "Title field is required").notEmpty();

  // check errors
  var errors = req.validationErrors();

  if (errors) {
    res.render("addcategory", {
      errors: errors,
      title: title,
    });
  } else {
    var categories = db.get("categories");

    // Submit to db
    categories.insert(
      {
        title: title,
      },
      function (err, category) {
        if (err) {
          res.send("There was an issure submitting the category");
        } else {
          req.flash("success", "Category Submitted");
          res.location("/");
          res.redirect("/");
        }
      }
    );
  }
});

module.exports = router;
