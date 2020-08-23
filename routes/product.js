const express = require('express');
const router = express.Router();
const { Food } = require('../models/Food');
const multer = require('multer');

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
  let term = req.body.searchTerm;
  const findArgs = {};

  for (let key in req.body.filters) {
    if (req.body.filters[key].length > 0) {
      if (key === 'price') {
        findArgs[key] = {
          $gte: req.body.filters[key][0],
          $lte: req.body.filters[key][1],
        };
      } else {
        findArgs[key] = req.body.filters[key];
      }
    }
  }

  if (term) {
    Food.find(findArgs)
      .find({ $text: { $search: term } })
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
  } else {
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
  }
});

//foods_by_id?id=${foodId}&type=single
router.get('/foods_by_id', (req, res) => {
  let type = req.query.type;
  let foodIds = req.query.id;

  if (type === 'array') {
    let ids = req.query.id.split(',');
    foodIds = [];
    foodIds = ids.map((item) => {
      return item;
    });
  }

  //FIND FOOD THAT BELONGS TO THE FOOD ID

  Food.find({ _id: { $in: foodIds } })
    .populate('owner')
    .exec((err, food) => {
      if (err) return res.status(400).send(err);
      return res.status(200).json(food);
    });
});

module.exports = router;
