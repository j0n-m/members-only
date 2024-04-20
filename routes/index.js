const router = require('express').Router();
const indexController = require('../controllers/indexController');


router.get('/', indexController.index);
router.get('/signup', indexController.signup_get);
router.post('/signup', indexController.signup_post);
router.get('/login', indexController.login_get);
router.post('/login', indexController.login_post);
router.get('/logout', indexController.logout_get)


module.exports = router;