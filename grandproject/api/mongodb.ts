// MongoDB client for storing raw job post data
import { MongoClient } from 'mongodb'

const client = new MongoClient(process.env.MONGODB_URI!)

export const connectToMongoDB = async () => {
  try {
    await client.connect()
    return client.db('grandproject')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    throw error
  }
}

// Job post operations
export const saveJobPost = async (jobPost: any) => {
  const db = await connectToMongoDB()
  const collection = db.collection('jobPosts')
  
  return await collection.insertOne({
    ...jobPost,
    createdAt: new Date(),
  })
}

export const getJobPosts = async (filters: any = {}) => {
  const db = await connectToMongoDB()
  const collection = db.collection('jobPosts')
  
  return await collection.find(filters).toArray()
}

export const searchJobPosts = async (query: string) => {
  const db = await connectToMongoDB()
  const collection = db.collection('jobPosts')
  
  return await collection.find({
    $text: { $search: query }
  }).toArray()
}
