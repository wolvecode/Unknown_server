const express = require('express');
const router = express.Router();
const { Food } = require('../models/Food');
const multer = require('multer');
const { auth } = require('../middleware/auth');

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== '.jpg' || ext !== '.png') {
      return cb(res.status(400).end('only jpg and png are allowed'), false);
    }
    cb(null, true);
  },
});

var upload = multer({ storage: storage }).single('file');
//=================================
//             Prodeuct Upload
//=================================

router.post('/uploadImage', (req, res) => {
  upload(req, res, (err) => {
    if (err) return res.json({ success: false, err });
    return res.json({
      success: true,
      image: res.req.file.path,
      filename: res.req.file.filename,
    });
  });
});

router.post('/uploadFood', (req, res) => {
  const food = new Food(req.body);
  food.save((err) => {
    if (err) return res.status(400).json({ success: false, err });
    return res.status(200).json({ success: true });
  });
});

router.post('/getFood', (req, res) => {
  let order = req.body.order ? req.body.order : 'desc';
  let sortBy = req.body.sortBy ? req.body.sortBy : '_id';
  let limit = req.body.limit ? parseInt(req.body.limit) : 100;
  let skip = parseInt(req.body.skip);

  const findArgs = {};
  // console.log(req.body.filters);
  for (let key in req.body.filters) {
    // console.log(key);
    if (req.body.filters[key].length > 0) {
      if (key === 'price ') {
      } else {
        findArgs[key] = req.body.filters[key];
        // console.log(findArgs);
      }
    }
  }

  Food.find(findArgs)
    .populate('owner')
    .sort([[sortBy, order]])
    .skip(skip)
    .limit(limit)
    .exec((err, foods) => {
      if (err) return res.status(400).json({ success: false, err });
      return res
        .status(200)
        .json({ success: true, foods, postSize: foods.length });
    });
});

module.exports = router;
