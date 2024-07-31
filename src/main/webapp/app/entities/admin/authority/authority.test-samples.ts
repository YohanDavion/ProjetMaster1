import { IAuthority, NewAuthority } from './authority.model';

export const sampleWithRequiredData: IAuthority = {
  name: 'a461d3fe-a01d-48ee-9b38-9d3c7302929f',
};

export const sampleWithPartialData: IAuthority = {
  name: '7544718d-79c7-479c-a92b-b2824c87b2d2',
};

export const sampleWithFullData: IAuthority = {
  name: '187fc779-2f83-4ae2-a6f9-f3309364dcef',
};

export const sampleWithNewData: NewAuthority = {
  name: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
