import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { User } from "../Models/user.model.js";
import { uploadOnCloudinary } from "../Utils/cloudinary.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    console.log("1. registerUser called");
    const { fullname, email, username, password } = req.body;

    if ([fullname, email, username, password].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }
    console.log("2. Validation passed");

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });
    console.log("3. User existence check done", existedUser);

    if (existedUser) {
        throw new ApiError(409, "User with username or email already exists");
    }

    const avatarBuffer = req.files?.avatar?.[0]?.buffer;
    console.log("4. avatarBuffer extracted:", avatarBuffer ? "exists" : "undefined");
    
    let coverImageBuffer;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageBuffer = req.files.coverImage[0].buffer;
    }
    console.log("5. coverImageBuffer extracted:", coverImageBuffer ? "exists" : "undefined");

    if (!avatarBuffer) {
        throw new ApiError(400, "Avatar file is required");
    }

    console.log("6. Starting Cloudinary upload for avatar...");
    const avatar = await uploadOnCloudinary(avatarBuffer, { folder: "users/avatars" });
    console.log("7. Avatar uploaded:", avatar ? "success" : "failed");

    const coverImage = coverImageBuffer 
        ? await uploadOnCloudinary(coverImageBuffer, { folder: "users/covers" }) 
        : null;
    console.log("8. Cover image uploaded:", coverImage ? "success" : "skipped");

    if (!avatar) {
        throw new ApiError(400, "Avatar upload failed");
    }

    console.log("9. Creating user in database...");
    const user = await User.create({
        fullname,
        avatar: avatar.secure_url,
        coverImage: coverImage?.secure_url || "",
        email,
        password,
        username: username.toLowerCase()
    });
    console.log("10. User created:", user._id);

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    console.log("11. User fetched for response");
    
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user");
    }

    console.log("12. Sending response");
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "Username or email required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser,
                accessToken,
                refreshToken
            }, "User logged in successfully")
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: undefined } },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken ?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refresh Token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
             throw new ApiError(401,"Refresh Token is Expired or Used")
        }
    
        const options = {
            httpOnly:true,
            secure:true
        }
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(200,{accessToken ,refreshToken : newRefreshToken},
                "Access token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res.status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(new ApiResponse(200,req.user,"current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullname,email} = req.body

    if(!fullname || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user= User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,email:email
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200),user,"Account details updated successfully")
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200)
    .json(
        new ApiResponse(200,user,"avatar updated successfully")
    )
})

const updateUserCoverImg = asyncHandler(async(req,res)=>{
    const coverImgLocalPath = req.file?.path

    if(!coverImgLocalPath){
        throw new ApiError(400,"cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImgLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading on cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200)
    .json(
        new ApiResponse(200,user,"cover image updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }

    const channel = await User.aggregate([
        //these are pipelines of mongoDB
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    //condition
                    $cond:{
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            //limited things will be allowed
            $project:{
                fullname: 1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404,"channel does not exist")
    }

    return res.status(200)
    .json(new ApiResponse(200, channel[0], "User channel fetched successfully"))
})

export { 
    registerUser,
    loginUser,
    logoutUser ,
    refreshAccessToken,
    generateAccessAndRefreshTokens,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImg,
    getUserChannelProfile 
}; 