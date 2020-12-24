const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const { Food } = require('../models/Food');
const { Payment } = require('../models/Payment');
const async = require('async');
const { auth } = require('../middleware/auth');

//=================================
//             User
//=================================

//return all info if authenicated

router.get('/auth', auth, (req, res) => {
  res.status(200).json({
    _id: req.user._id,
    isAdmin: req.user.role === 'Admin' ? true : false,
    isAuth: true,
    email: req.user.email,
    name: req.user.name,
    lastname: req.user.lastname,
    role: req.user.role,
    image: req.user.image,
    cart: req.user.cart,
    history: req.user.history,
  });
});

router.post('/register', (req, res) => {
  const user = new User(req.body);

  user.save((err, doc) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).json({
      success: true,
    });
  });
});

//Login
router.post('/login', (req, res) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (!user)
      return res.json({
        loginSuccess: false,
        message: 'Auth failed, email not found',
      });

    user.comparePassword(req.body.password, (err, isMatch) => {
      if (!isMatch)
        return res.json({ loginSuccess: false, message: 'Wrong password' });

      user.generateToken((err, user) => {
        if (err) return res.status(400).send(err);
        res.cookie('w_authExp', user.tokenExp);
        res.cookie('w_auth', user.token).status(200).json({
          loginSuccess: true,
          userId: user._id,
        });
      });
    });
  });
});

router.get('/logout', auth, (req, res) => {
  User.findOneAndUpdate(
    { _id: req.user._id },
    { token: '', tokenExp: '' },
    (err, doc) => {
      if (err) return res.json({ success: false, err });
      return res.status(200).send({
        success: true,
      });
    }
  );
});

//Find user, check if id sent exist. if exist trigger duplicate,
//(Increase number of exist item) if not create new item item

router.post('/addToCart', auth, (req, res) => {
  User.findOne({ _id: req.user._id }, (err, userInfo) => {
    let duplicate = false;

    userInfo.cart.forEach((item) => {
      if (item.id == req.query.foodId) {
        duplicate = true;
      }
    });

    if (duplicate) {
      User.findOneAndUpdate(
        {
          _id: req.user._id,
          'cart.id': req.query.foodId,
        },
        { $inc: { 'cart.$.quantity': 1 } },
        { new: true },
        (err, userInfo) => {
          if (err) return res.json({ success: false, err });
          return res.status(200).json(userInfo.cart);
        }
      );
    } else {
      User.findByIdAndUpdate(
        { _id: req.user._id },
        {
          $push: {
            cart: {
              id: req.query.foodId,
              quantity: 1,
              date: Date.now,
            },
          },
        },
        { new: true },
        (err, userInfo) => {
          if (err) return res.json({ success: false, err });
          return res.status(200).json(userInfo.cart);
        }
      );
    }
  });
});

//Find both user id and food id and romove it from cart
router.get('/removeFromCart', auth, (req, res) => {
  User.findOneAndUpdate(
    { _id: req.user._id },
    { $pull: { cart: { id: req.query._id } } },
    { new: true },
    (err, userInfo) => {
      let cart = userInfo.cart;
      let array = cart.map((item) => {
        return item.id;
      });

      Food.find({ _id: { $in: array } })
        .populate('owner')
        .exec((err, cartDetail) => {
          return res.status(200).json({ cartDetail, cart });
        });
    }
  );
});

//Handle showTotal at frontend( SHow the infomation(data) in the cart)
router.get('/userCartInfo', auth, (req, res) => {
  User.findOne({ _id: req.user._id }, (err, userInfo) => {
    let cart = userInfo.cart;
    let array = cart.map((item) => {
      return item.id;
    });

    Food.find({ _id: { $in: array } })
      .populate('owner')
      .exec((err, cartDetail) => {
        if (err) return res.status(400).json(err);
        return res.status(200).json({ success: true, cartDetail, cart });
      });
  });
});

//HANDLE SUCCESSFUL PAYMENT
//SET CART TO EMPTY WHEN PAYMENT IS SUCCESSFUL
//SENT DATA FOT SOLD
//AND SENT DATA FOR HISTORY
router.post('/successBuy', auth, (req, res) => {
  let history = [];
  let transactionData = {};

  //Save payment info inside the user collection

  req.body.cartDetail.forEach((item) => {
    history.push({
      name: item.name,
      id: item._id,
      price: item.price,
      quantity: item.quantity,
      dateOfPurchase: Date.now(),
      paymentId: req.body.paymentData.tx.id,
    });
  });

  //save payment info from rave into payment collection

  transactionData.user = {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
  };

  transactionData.data = req.body.paymentData.data;

  transactionData.product = history;

  User.findOneAndUpdate(
    { _id: req.user._id },
    { $push: { history: history }, $set: { cart: [] } },
    { new: true },
    (err, user) => {
      //If Error
      if (err) return res.json({ success: false, err });
      //If Success
      const payment = new Payment({
        user: transactionData.user,
        data: {
          id: transactionData.data.data.id,
          chargeResponseCode: transactionData.data.data.chargeResponseCode,
          narration: transactionData.data.data.narration,
          chargeRequestData: transactionData.data.data.chargeRequestData,
          chargeResponseData: transactionData.data.data.chargeResponseData,
        },
        product: transactionData.product,
      });

      payment.save((err, doc) => {
        //If Error
        if (err) return res.json({ success: false, err });

        //If Success
        //Increase the amount of number of the sold information
        let products = [];
        doc.product.forEach((item) => {
          products.push({
            id: item.id,
            quantity: item.quantity,
          });

          // first item: quantity 2
          // second item : 3
          async.eachSeries(
            products,
            (item, callback) => {
              Food.updateMany(
                { _id: item.id },
                {
                  $inc: { sold: item.quantity },
                },
                { new: false },
                callback
              );
            },
            (err) => {
              if (err) return res.json({ success: false, err });
              res.status(200).json({
                success: true,
                cart: user.cart,
                cartDetail: [],
              });
            }
          );
        });
      });
    }
  );
});

//GET INFORMATION FOR HISTORY PAGE
router.get('/getHistory', auth, (req, res) => {
  User.findOne({ _id: req.user._id }, (err, doc) => {
    let history = doc.history;
    if (err) return res.status(400).send(err);
    return res.status(200).json({ success: true, history });
  });
});

module.exports = router;
