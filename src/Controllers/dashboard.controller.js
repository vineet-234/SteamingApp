import mongoose from "mongoose"
import { isValidObjectId } from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../Models/subscription.model.js"
import {Like} from "../Models/like.model.js"
import {ApiError} from "../Utils/ApiError.js"
import {ApiResponse} from "../Utils/ApiResponse.js"
import {asyncHandler} from "../Utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel ID")
    }

    const totalVideos= await Video.countDocuments(
        {owner: channelId}
    )

    const viewsAgg = await Video.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group : {
                _id : null,
                totalViews :
                {
                    $sum : "$views"
                }
            }
        }
    ])
    const totalViews = viewsAgg[0]?.totalViews || 0


    const totalSubscribers = await Subscription.countDocuments(
        { channel : channelId}
    )

    const likeAgg = await Like.aggregate([
        {
            $match : {
                video : {
                    $exists : true,
                    $ne : null
                }
            }
        },
        {
            $lookup : {
                from : "videos",
                localField: "video",
                foreignField:"_id",
                as: "videoData"
            }
        },
        {
            $unwind : "$videoData"
        },
        {
            $match : {
                "videoData.owner": new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $count : "totalLikes"
        }
    ])

    const totalLikes = likeAgg[0]?.totalLikes || 0

    return res
        .status(200)
        .json(new ApiResponse(200, {
            totalVideos,
            totalViews,
            totalSubscribers,
            totalLikes
        }, "Channel stats fetched successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel ID")
    }

    const videos = await Video.find(
        {owner : channelId}
        .sort({createdAt : -1})
        .select("-__v")
    )

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Channel videos fetched successfully"))
})

export {
    getChannelStats, 
    getChannelVideos
    }