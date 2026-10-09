import { MongoDBAdapter } from "@auth/mongodb-adapter";
import client from "@/src/lib/mongodb";

export default MongoDBAdapter(client, {
  databaseName: process.env.MONGODB_AUTH_DB_NAME,
});
