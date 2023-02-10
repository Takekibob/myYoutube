const express = require("express");
const router = express.Router();

// ここまで追加
// Require controller modules.
const admin_controller = require("../controllers/adminController");
const comment_controller = require("../controllers/commentController");
const follow_controller = require("../controllers/followController");
const good_controller = require("../controllers/goodController");
const thread_controller = require("../controllers/threadController");
const user_controller = require("../controllers/userController");

// Thread Controller
router.get("/", thread_controller.list_get);
router.get("/threads/add", thread_controller.add_get);
router.post("/threads/create", thread_controller.create_post);
router.get("/threads/edit/:threadId", thread_controller.edit_get);
router.post("/threads/update/:threadId", thread_controller.update_post);
router.get("/threads/view/:threadId", thread_controller.view_get);

// Comment Controller
router.post("/comments/create/:threadId", comment_controller.create_post);
router.get("/comments/edit/:commentId", comment_controller.edit_get);
router.post("/comments/update/:threadId/:commentId", comment_controller.update_post);

// // Good Controller
router.post("/goods/thread_create/:threadId", good_controller.post_threadCreate);
router.post("/goods/thread_destroy/:threadId", good_controller.post_threadDestroy);
router.post("/goods/comment_create/:threadId/:commentId", good_controller.post_commentCreate);
router.post("/goods/comment_destroy/:threadId/:commentId", good_controller.post_commentDestroy);

// // User Controller
router.get("/users/view/:userId", user_controller.view_get);
router.get("/register", user_controller.register_get)
router.post("/register", user_controller.register_post)
router.post("/mail_callback", user_controller.mailCallbackPost)
router.get("/login", user_controller.loginGet)
router.post("/login", user_controller.loginPost)
router.get("/login-failure", user_controller.loginFailureGet)
router.get("/post-mail-success", user_controller.mailSuccessGet)
router.get("/logout", user_controller.logoutGet)
router.get("/notAuthorized", user_controller.notAuthlizedPost);
router.get("/mailCheckConfirm/:activateToken", user_controller.mailCheckConfirmGet);
router.get("/mypage", user_controller.mypageGet)

// // Follow Controller
router.get("/follows/:targetId", follow_controller.followGet);



module.exports = router;