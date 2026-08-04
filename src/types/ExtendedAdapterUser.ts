import { AdapterUser } from "next-auth/adapters";

// Tạo interface mới kế thừa AdapterUser
export interface ExtendedAdapterUser extends AdapterUser {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  password?: string;
  createdAt?: Date;
  bio?: string;
  phone?: string;
}
