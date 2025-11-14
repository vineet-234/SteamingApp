import { asyncHandler } from "../Utils/asyncHandler.js";
import {ApiError} from "../Utils/ApiError.js"
import {User} from "../Models/user.model.js"
import {uploadOnCloudinary} from "../Utils/cloudinary.js"
import { ApiResponse } from "../Utils/ApiResponse.js";

const registerUser = asyncHandler(async(req,res)=>{
   
    const {fullname,email,username,password} = req.body
    console.log("email",email);

    if(
        [fullname,email,username,password].some((field) =>
            field ?.trim() === ""
        )
    ){
        throw new ApiError(400,"All feilds are required")
    }

    const existedUser = User.findOne({
        $or: [{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409,"user with username or email already exists")
    }

    const avatarLocalPath = req.files ?.avatar[0] ?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar fies is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    const coverImage= await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"Avatar fies is required")
    }

    const user= await User.create({
        fullname,
        avatar: avatar.url,
        coverImage : coverImage.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"something went wrong while registering user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser, "user registerd successfully")
    )

})



export {registerUser}