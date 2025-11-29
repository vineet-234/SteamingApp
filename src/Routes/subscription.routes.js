import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../Controllers/subscription.controller.js"
import {verifyJWT} from "../Middlewares/auth.middleware.js"

const router= Router();

router.use(verifyJWT);

router.route("/c/:channelId").get(getSubscribedChannels).post(toggleSubscription);

router.route("/u/:subscribedId").get(getUserChannelSubscribers);

export default router