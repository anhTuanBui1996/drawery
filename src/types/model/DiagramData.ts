export interface DiagramInfo {
  diagramId: string;
  createdAt: Date;
  isOwned: boolean;
  isPrivate: boolean;
  ownerAvatar?: string | null | undefined;
  ownerName?: string | null | undefined;
  lastUpdatedAt?: Date;
  title?: string | null;
}
