import clientPromise from "../../backend-services/mongoService";
export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("Bot");
  if (req.method === "GET") {
    const data = await db.collection("Deployements").find({}).toArray((err, res) => {
      if (err) throw err;
      return res;
    });
    return res.status(200).json({ data });
  }
  if(req.method==="POST") {
    const {creator,address}=req.body;
    const data = await db.collection("Deployements").insertOne({creator:creator,address:address},(err,res)=>{
        if(err)
        throw err;
        return res;
    })
    return res.status(200).json({message:"DB entry added"})
  }
  if(req.method==="DELETE"){
    const {creator,address}=req.body;
    const data = await db.collection("Deployements").deleteOne({creator:creator,address:address},(err,res)=>{
        if(err) throw err;
        return res;
    })
    return res.status(200).json({message:"DB entry removed"})
  }
  res.status(200).json({ name: "John Doe" });
}
