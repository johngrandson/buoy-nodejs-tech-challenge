import { Entity, Property } from '@mikro-orm/core';
import { Accommodation } from './accommodation.entity';

@Entity({
  discriminatorValue: 'apartment',
})
export class Apartment extends Accommodation {
  @Property()
  numberOfBedrooms!: number;

  @Property()
  numberOfBathrooms!: number;

  @Property()
  squareMeters!: number;

  @Property({ nullable: true })
  floor?: number;

  @Property({ nullable: true })
  hasElevator?: boolean;

  constructor() {
    super();
    this.type = 'apartment';
  }
}
