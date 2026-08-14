import { MongoDBAdapter } from "@auth/mongodb-adapter";
import client from "@/src/lib/db";

export default MongoDBAdapter(client, {
  databaseName: process.env.MONGODB_AUTH_DB_NAME,
});
