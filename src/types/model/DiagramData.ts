import { SQLProviderName } from "../data/DiagramTransfer";

export interface DiagramInfo {
  diagramId: string;
  createdAt: Date;
  isOwned: boolean;
  isPrivate: boolean;
  ownerAvatar?: string | null | undefined;
  ownerName?: string | null | undefined;
  lastUpdatedAt?: Date;
  providerName: SQLProviderName;
  title?: string | null;
}
