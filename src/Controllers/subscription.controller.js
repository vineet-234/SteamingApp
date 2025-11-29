import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../Models/user.model.js"
import {Subscription} from "../Models/subscription.model.js"
import {ApiError} from "../Utils/ApiError.js"
import {ApiResponse} from "../Utils/ApiResponse.js"
import {asyncHandler} from "../Utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel ID");
    }
    const existingSub = await Subscription.findOne({
        subscriber : req.user._id,
        channel : channelId
    })

    if(existingSub){
        await Subscription.findByIdAndDelete(existingSub._id);
        return res.status(200,{subscribed : false},"unsubscribed successfully")
    }

    await Subscription.create({
        subscriber: req.user._id,
        channel:channelId
    })

    return res.status(201).json(
        new ApiResponse(201, { subscribed: true }, "Subscribed successfully")
    );
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel ID");
    }

    const subscribers = await Subscription.find({channel : channelId}).populate("subscriber","username email avatar");

    return res.status(200).json(
        new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }

    const channels = await Subscription.find({subscriber : subscriberId}).populate("channel","username email avatar");

    return res.status(200).json(
        new ApiResponse(200, channels, "Subscribed channels fetched successfully")
    );
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}