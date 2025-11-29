import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../Models/video.model.js"
import {User} from "../Models/user.model.js"
import {ApiError} from "../Utils/ApiError.js"
import {ApiResponse} from "../Utils/ApiResponse.js"
import {asyncHandler} from "../Utils/asyncHandler.js"
import {uploadOnCloudinary} from "../Utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query

    const filters = {}

    // Search query by title or description
    if (query) {
        filters.$or = [
            //regex for matching letters in searching and options:i for making case inSensitive
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ]
    }

    // Filter by user
    if (userId && isValidObjectId(userId)) {
        filters.owner = userId
    }

    const sortObj = {}
    if (sortBy) {
        sortObj[sortBy] = sortType === "asc" ? 1 : -1
    }

    const videos = await Video.find(filters)
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))

    const total = await Video.countDocuments(filters)

    return res
        .status(200)
        .json(new ApiResponse(200, { videos, total, page, limit }, "Videos fetched successfully"))
})


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if(!title || !description){
        throw new ApiError(400,"title and desciption are required")
    }

    const videoLocalPath = req.files?.video?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    const uploadedVideo = await uploadOnCloudinary(videoLocalPath);
    const uplodedThumb = thumbnailLocalPath ? await uploadOnCloudinary(thumbnailLocalPath) : null

    const newVideo = await Video.create({
        title,
        description,
        videoFile : uploadedVideo.url,
        thumbnail: uplodedThumb?.url || "",
        owner: req.user._id
    })

    return res.status(201)
    .json(new ApiResponse(201,newVideo,"video published successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "invalid video id")
    }

    const video = await Video.findById(videoId).populate("owner","username email")

    if(!video) throw new ApiError(404,"video not found")

    return res.status(200)
    .json(new ApiResponse(200,video,"video fetched succesfully"));
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid video Id")
    }

    const {title,description} = req.body

    const updateObj ={}

    if(title) updateObj.title=title
    if(description) updateObj.description=description

    if(req.file){
        const thumbnailUpload = await uploadOnCloudinary(req.file.path)
        updateObj.thumbnail = thumbnailUpload.url
    }
    
    const updatedVideo = await Video.findByIdAndUpdate(videoId,updateObj,{new:true})

    if(!updatedVideo) throw new ApiError(404, "Video not found")
    
    return res.status(200).json(new ApiResponse(200, updatedVideo, "Video updated successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID")

    const deleted = await Video.findByIdAndDelete(videoId)

    if (!deleted) throw new ApiError(404, "Video not found")

    return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID")

    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(404, "Video not found")

    video.isPublished = !video.isPublished
    await video.save()

    return res.status(200).json(
        new ApiResponse(200, { isPublished: video.isPublished }, "Publish status updated")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}