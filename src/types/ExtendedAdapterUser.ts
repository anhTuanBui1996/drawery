import { AdapterUser } from "next-auth/adapters";

// Tạo interface mới kế thừa AdapterUser
export interface ExtendedAdapterUser extends AdapterUser {
  username: string;
  firstName?: string;
  lastName?: string;
  password: string;
  createdAt?: Date;
}
