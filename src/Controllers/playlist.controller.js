import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../Models/playlist.model.js"
import {ApiError} from "../Utils/ApiError.js"
import {ApiResponse} from "../Utils/ApiResponse.js"
import {asyncHandler} from "../Utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!name || name.trim() === ""){
        throw new ApiError(400, "Playlist name is required");
    }

    const playlist = await Playlist.create({
        name,description,
        owner : req.user._id
    })

    return res.status(201).json(
        new ApiResponse(201, playlist, "Playlist created successfully")
    );

    //TODO: create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if(!isValidObjectId){
        throw new ApiError(400, "Invalid user ID");
    }
    const playlists = await Playlist.find({owner : userId});

    return res.status(200).json(
        new ApiResponse(200, playlists, "Playlists fetched successfully")
    );

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findById(playlistId).populate("videos");

    if(!playlist){
        throw new ApiError(404, "playlist not found");
    }

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    );
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId) || isValidObjectId(videoId)){
       throw new ApiError(400, "Invalid playlist or video ID"); 
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "Playlist not found");

    if(playlist.videos.includes(videoId)){
        throw new ApiError(400, "Video already exists in playlist");
    }

    playlist.videos.push(videoId);
    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, playlist, "Video added to playlist")
    );
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }
    
    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404, "Playlist not found");
    }

    playlist.videos = playlist.videos.filter(
        (vid) => vid.toString() !== videoId
    )

    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200,playlist,"video removed from playlist")
    )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const deleted = await Playlist.findOneAndDelete({
        _id : playlistId,
        owner : req.user._id
    })

    if (!deleted) {
        throw new ApiError(404, "Playlist not found or not authorized");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Playlist deleted successfully")
    );
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const updateData = {};

    if(name) {
        updateData.name = name;
    }
    if(description){
        updateData.description = description;
    }

    const updated = await Playlist.findOneAndUpdate(
        {
            _id : playlistId,
            owner : req.user._id
        },
        updateData,
        { new : true }
    )

    if (!updated) {
        throw new ApiError(404, "Playlist not found or not authorized");
    }

    return res.status(200).json(
        new ApiResponse(200, updated, "Playlist updated successfully")
    );
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}