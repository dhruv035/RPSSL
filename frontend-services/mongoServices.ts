
import { Deployement } from "../pages";

export const getDeployements=async ()=>{
    const result = await fetch("/api",{
        method:"GET"
    })
    return await result.json();
}

export const addDeployement = async (data:Deployement)=>{
    const result = await fetch("/api",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify(data)
    })
    return await result.json();
}

export const removeDeployement = async (data:Deployement)=>{
    const result = await fetch("/api",{
        method:"DELETE",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify(data)
    })
    return await result.json();
}