const router = require('express').Router();
const indexController = require('../controllers/indexController');


router.get('/', indexController.index);
router.get('/signup', indexController.signup_get);
router.post('/signup', indexController.signup_post);
router.get('/login', indexController.login_get);
router.post('/login', indexController.login_post);
router.get('/logout', indexController.logout_get);
router.get('/join', indexController.join_get);
router.post('/join', indexController.join_post)
router.get('/create', indexController.create_get);
router.post('/create', indexController.create_post);
router.post('/delete-post', indexController.deletePost_post)
router.get('/delete-post/:id', indexController.deletePost_get)


module.exports = router;