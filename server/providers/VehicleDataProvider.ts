import {
  VehicleBasicData,
  TheftStatus,
  FinancingStatus,
  AccidentHistory,
  AuctionHistory,
  FinesStatus,
  OwnerStatus,
  AdministrativeRestrictions,
  VehicleDebts,
  ProviderConfig
} from '../../shared/types/index.ts';

export interface CompleteVehicleData {
  basic?: VehicleBasicData;
  theft?: TheftStatus;
  financing?: FinancingStatus;
  accident?: AccidentHistory;
  auction?: AuctionHistory;
  fines?: FinesStatus;
  debitos?: VehicleDebts;
  administrativeRestrictions?: AdministrativeRestrictions;
  owner?: OwnerStatus;
  raw?: any;
}

export interface ProviderResponse<T> {
  success: boolean;
  data?: T;
  sourceId: string;
  sourceName: string;
  latencyMs: number;
  errorMessage?: string;
  status: 'success' | 'unavailable' | 'timeout' | 'rate_limited' | 'error';
}

export interface VehicleDataProvider {
  readonly config: ProviderConfig;
  readonly name?: string;
  readonly id?: string;
  readonly type?: 'paid' | 'official' | 'commercial' | 'mock';
  readonly cost?: number;
  readonly timeout?: number;

  getBasicData(plate: string): Promise<ProviderResponse<VehicleBasicData>>;
  getTheftStatus(plate: string): Promise<ProviderResponse<TheftStatus>>;
  getFinancing?(plate: string): Promise<ProviderResponse<FinancingStatus>>;
  getAccidentHistory?(plate: string): Promise<ProviderResponse<AccidentHistory>>;
  getAuctionHistory?(plate: string): Promise<ProviderResponse<AuctionHistory>>;
  getFines?(plate: string): Promise<ProviderResponse<FinesStatus>>;
  getAdministrativeRestrictions?(plate: string): Promise<ProviderResponse<AdministrativeRestrictions>>;
  getOwner?(plate: string): Promise<ProviderResponse<OwnerStatus>>;
  consultarCompleto?(plate: string): Promise<ProviderResponse<CompleteVehicleData>>;
  healthCheck(): Promise<{ online: boolean; latencyMs: number; message?: string } | boolean>;
}
