import { Router } from "express";

import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../Controllers/tweet.controller.js";

import {verifyJWT} from "../Middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT);

router.route("/").post(createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router