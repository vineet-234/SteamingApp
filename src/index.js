import dotenv from "dotenv";
import connectDB from "./Db/index.js";

dotenv.config({
    path : './env'
})



connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000),() =>{
        console.log(`Server is running on port ${process.env.PORT || 8000}`);
    }
})
.catch((err)=>{
    console.error("MONGODB CONNECTION FAILED:", err);
})




/*
import express from "express";
const app=express();


(async()=>{
    try{
        await mongoose.connect(`${process.env.MONGO_URI}/$
        {DB_NAME}`);
        app.on("error",(error)=>{console.log("ERROR:",error); 
        throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`app is listenung on port ${process.env.PORT}`);
        })
    }
    catch(error){
        console.error("ERROR:", error);
        throw error;
        
    }
})()

*/