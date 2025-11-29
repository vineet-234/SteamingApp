import { ApiError } from "../Utils/ApiError";
import { ApiResponse } from "../Utils/ApiResponse";
import { asyncHandler } from "../Utils/asyncHandler";

const healthcheck = asyncHandler(async(req,res)=>{
 return res.status(200).json(new ApiResponse(200,
    {
        status:"OK",
        uptime: process.uptime(),
        timesatmp: new Date().toISOString()
    },
    "Server is healthy")
 )
})

export  {healthcheck}