import mongoose from "mongoose";
import { isValidObjectId } from "mongoose";
import {Comment} from "../Models/comment.model.js"
import {ApiError} from "../Utils/ApiError.js"
import {ApiResponse} from "../Utils/ApiResponse.js"
import {asyncHandler} from "../Utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid video ID")
    }

    const skip = (page-1)*limit;

    const comments = await Comment.find(
        {video : videoId}
    )
    .populate("owner","username avatar")
    .sort({createdAt : -1})
    .skip(skip)
    .limit(Number(limit));

    const total = await Comment.countDocuments({video : videoId});

    return res.status(200).json(
        new ApiResponse(
            200, {
                comments,
                pagination : {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages : Math.ceil(total/limit)
                }
            },
            "comments fetched successfully"
        )
    )
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId} = req.params;
    const {content} = req.body;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid video Id");
    }

    if(!content || content.trim()=== ""){
        throw new ApiError(400, "Comment content is required");
    }

    const comment = await Comment.create({
        content,
        video : videoId,
        owner : req.user?._id
    })

    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Comment added successfully"));
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const { commentId} = req.params;
    const {content} = req.body;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"invalid comment ID")
    }

    const comment = await Comment.findById(commentId);

    if(!comment) throw new ApiError(404,"comment not found");

    if(String(comment.owner) !== String(req.user?._id)){
        throw new ApiError(403, "you cannot edit this comment");
    }

    if(!content || content.trim() === ""){
        throw new ApiError(400, "Content cannot be empty");
    }

    comment.content = content;
    await comment.save();

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment updated successfully"));
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const {commentId} = req.params;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);

    if(!comment) {
        throw new ApiError(404, "comment not found");
    }

    if(String(comment.owner) !== String(req.user?._id)){
        throw new ApiError(403, "You cannot delete this comment");
    }

    await comment.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment deleted successfully"));
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }