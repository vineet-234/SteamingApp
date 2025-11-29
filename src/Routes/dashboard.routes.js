import { Router } from 'express';

import {
    getChannelStats,
    getChannelVideos,
} from "../Controllers/dashboard.controller.js"

import {verifyJWT} from "../Middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT);

router.route("/stats").get(getChannelStats);

router.route("/videos").get(getChannelVideos);

export default router