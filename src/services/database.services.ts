import { log } from 'console'
import { MongoClient, ServerApiVersion, Db, Collection } from 'mongodb'
import { config } from 'dotenv'
import User from '../models/schemas/User.schema'
import RefreshToken from '../models/schemas/RefreshToken.schema'
config()
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@tweetprojectk18f2.gzrc3ew.mongodb.net/?retryWrites=true&w=majority`

class DatabaseService {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(`${process.env.DB_NAME}`)
  }
  async connect() {
    try {
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      // Ensures that the client will close when you finish/error
      console.log('lỗi trong quá trình xử lí mongo', error)
      throw error
    }
  }
  get users(): Collection<User> {
    return this.db.collection(process.env.DB_USERS_COLLECTION as string)
  }

  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_REFRESH_TOKENS_COLLECTION as string)
  }
}
// Create a MongoClient with a MongoClientOptions object to set the Stable API version

const databaseService = new DatabaseService()
export default databaseService
