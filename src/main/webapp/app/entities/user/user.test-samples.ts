import { IUser } from './user.model';

export const sampleWithRequiredData: IUser = {
  id: 9331,
  login: '7@98\\jEMA\\,JD\\^k4\\&t',
};

export const sampleWithPartialData: IUser = {
  id: 30772,
  login: 'CRx_@1',
};

export const sampleWithFullData: IUser = {
  id: 26221,
  login: 'pj-',
};
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
