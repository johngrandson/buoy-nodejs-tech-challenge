import { Entity, Property } from '@mikro-orm/core';
import { Accommodation } from './accommodation.entity';

@Entity({
  discriminatorValue: 'hotel',
})
export class Hotel extends Accommodation {
  @Property()
  numberOfRooms!: number;

  @Property()
  starRating!: number;

  constructor() {
    super();
    this.type = 'hotel';
  }
}
