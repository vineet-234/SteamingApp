import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../Models/like.model.js"
import {ApiError} from "../Utils/ApiError.js"
import {ApiResponse} from "../Utils/ApiResponse.js"
import {asyncHandler} from "../Utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    if(!isValidObjectId){
       throw new ApiError(400, "Invalid video ID"); 
    }

    const existingLike = await Like.findOne({
        likedBy : req.user._id,
        video: videoId
    })

    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id);

        return res.status(200).json(
            ApiResponse(200,{liked : false},"Video Unliked")
        );
    }

    await Like.create({
        video: videoId,
        likedBy : req.user._id
    })

    return res.status(201).json(
        new ApiResponse(201, { liked: true }, "Video liked")
    );
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!isValidObjectId){
        throw new ApiError(400,"invalid comment id");
    }

    const existingLike = await Like.findOne({
        likedBy : req.user._id,
        comment : commentId
    })

    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id);

        return res.status(200).json(
            new ApiResponse(200,{liked:false,},"comment unliked")
        );
    }

    await Like.create({
        comment:commentId,
        likedBy: req.user._id
    })

    return res.status(201).json(
        new ApiResponse(201, { liked: true }, "Comment liked")
    );
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"invalid tweet id");
    }

    const existingLike = await Like.findOne({
        likedBy : req.user._id,
        tweet: tweetId
    })

    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id);

        return res.status(200).jason(
            new ApiResponse(200,{liked:false},"Tweet Unliked")
        );
    }

    await Like.create({
        tweet:tweetId,
        likedBy:req.user._id
    })

    return res.status(201).json(
        new ApiResponse(201, { liked: true }, "Tweet liked")
    );
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likes = await Like.find({
        likedBy : req.user._id,
        video : {$ne : null} 
    }).populate("video");

    return res.status(200).json(
        new ApiResponse(200, likes, "Liked videos fetched successfully")
    );
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}