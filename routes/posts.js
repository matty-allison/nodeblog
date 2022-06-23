var express = require("express");
var router = express.Router();
var mongo = require("mongodb");
var db = require("monk")("localhost/nodeblog");
var multer = require("multer");
const { post } = require(".");

// new multer way
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

var upload = multer({ storage: storage });

router.get("/show/:id", function (req, res, next) {
  var posts = db.get("posts");
  posts.findOne(req.params.id, function (err, post) {
    res.render("show", {
      post: post,
    });
  });
});

router.get("/add", function (req, res, next) {
  var categories = db.get("categories");

  categories.find({}, {}, function (err, categories) {
    res.render("addpost", {
      title: "Add Post",
      categories: categories,
    });
  });
});

router.post("/add", upload.single("mainimage"), function (req, res, next) {
  // Get form values
  var title = req.body.title;
  var category = req.body.category;
  var body = req.body.body;
  var author = req.body.author;
  var date = new Date();

  console.log(upload.single("mainimage"));

  if (req.file) {
    var mainImageName = req.file.originalname;
  } else {
    var mainImageName = "nomainimage.png";
  }

  // form Validation
  req.checkBody("title", "Title field is required").notEmpty();
  req.checkBody("body", "Body is required");

  // check errors
  var errors = req.validationErrors();

  if (errors) {
    res.render("addpost", {
      errors: errors,
      title: title,
      body: body,
    });
  } else {
    var posts = db.get("posts");

    // Submit to db
    posts.insert(
      {
        title: title,
        body: body,
        category: category,
        date: date,
        author: author,
        mainimage: mainImageName,
      },
      function (err, post) {
        if (err) {
          res.send("There was an issure submitting the post");
        } else {
          req.flash("success", "Post Submitted");
          res.location("/");
          res.redirect("/");
        }
      }
    );
  }
});

router.post("/addcomment", upload.single(), function (req, res, next) {
  // Get form values
  var name = req.body.name;
  var email = req.body.email;
  var body = req.body.body;
  var postid = req.body.postid;
  var commentdate = new Date();

  console.log(postid);

  // form Validation
  req.checkBody("name", "Name field is required").notEmpty();
  req.checkBody("email", "Email field is required").notEmpty();
  req.checkBody("email", "Email is not formatted correctly").isEmail();
  req.checkBody("body", "Body field is required").notEmpty();

  // check errors
  var errors = req.validationErrors();

  if (errors) {
    var posts = db.get("posts");
    posts.findOne(postid, function (err, post) {
      res.render("show", {
        errors: errors,
        post: post,
      });
    });
  } else {
    var comment = {
      name: name,
      email: email,
      body: body,
      commentdate: commentdate,
    };
    var posts = db.get("posts");

    // Submit to db
    posts.update(
      {
        _id: postid,
      },
      {
        $push: {
          comments: comment,
        },
      },
      function (err, doc) {
        if (err) {
          throw err;
        } else {
          req.flash("success", "Comment Added");
          res.location("/posts/show/"+postid);
          res.redirect("/posts/show/"+postid);
        }
      }
    );
  }
});

module.exports = router;
